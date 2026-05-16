<?php

namespace App\Services;

use App\Models\Consultation;
use App\Models\Message;
use App\Models\Prediction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ChatService
{
    protected $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Process a new chat message.
     */
    public function processMessage(string $userInput, int $userId, ?int $consultationId = null)
    {
        return DB::transaction(function () use ($userInput, $userId, $consultationId) {
            // 1. Get or create consultation
            $consultation = $consultationId 
                ? Consultation::findOrFail($consultationId)
                : Consultation::create(['user_id' => $userId, 'is_completed' => false]);

            // 2. Save User Message
            Message::create([
                'consultation_id' => $consultation->id,
                'sender' => 'user',
                'message_text' => $userInput
            ]);

            // 3. Fetch History (last 10 messages for context)
            $history = Message::where('consultation_id', $consultation->id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->reverse()
                ->toArray();

            // 4. Call AI
            $aiResponse = $this->aiService->chat($userInput, $history);

            // 5. Save AI Message
            Message::create([
                'consultation_id' => $consultation->id,
                'sender' => 'ai',
                'message_text' => $aiResponse['message']
            ]);

            // 6. Update predictions and consultation triage if not rejected
            if (!$aiResponse['is_rejected']) {
                $consultation->update(['triage_result' => $aiResponse['triage']]);

                // Clear old predictions for this consultation and add new ones
                Prediction::where('consultation_id', $consultation->id)->delete();
                foreach ($aiResponse['conditions'] as $condition) {
                    Prediction::create([
                        'consultation_id' => $consultation->id,
                        'condition_name' => $condition['name'],
                        'probability' => $condition['probability']
                    ]);
                }
            }

            return array_merge($aiResponse, ['consultation_id' => $consultation->id]);
        });
    }

    /**
     * Delete a consultation and all its data.
     */
    public function deleteConsultation(int $id)
    {
        return DB::transaction(function () use ($id) {
            $consultation = Consultation::findOrFail($id);
            $consultation->messages()->delete();
            $consultation->predictions()->delete();
            $consultation->delete();
            return true;
        });
    }
}
