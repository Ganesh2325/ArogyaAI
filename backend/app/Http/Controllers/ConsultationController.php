<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Consultation;
use App\Models\ConsultationMessage;
use App\Models\ConsultationMemory;
use App\Services\AIAssistantService;
use Illuminate\Support\Facades\Log;

class ConsultationController extends Controller
{
    protected $aiService;

    public function __construct(AIAssistantService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function start(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $consultation = Consultation::create([
            'user_id' => $user->id,
            'title' => 'New Consultation',
        ]);

        return response()->json([
            'consultation' => $consultation
        ]);
    }

    public function message(Request $request)
    {
        $request->validate([
            'consultation_id' => 'required|exists:consultations,id',
            'message' => 'required|string'
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $consultation = Consultation::findOrFail($request->consultation_id);

        if ($consultation->user_id !== $user->id) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        // Save User Message
        ConsultationMessage::create([
            'consultation_id' => $consultation->id,
            'role' => 'user',
            'message' => $request->message
        ]);

        // Get past memory context for this user
        $memories = ConsultationMemory::where('user_id', $user->id)
                                      ->orderBy('created_at', 'desc')
                                      ->limit(5)
                                      ->get();
        
        $memoryContext = "";
        foreach ($memories as $mem) {
            $memoryContext .= "- " . $mem->memory_fact . " (" . $mem->created_at->diffForHumans() . ")\n";
        }

        // Get recent chat history
        $history = ConsultationMessage::where('consultation_id', $consultation->id)
            ->orderBy('created_at', 'asc')
            ->get()
            ->toArray();

        // Call AI Service
        $response = $this->aiService->generateConsultationResponse($request->message, $history, $memoryContext);



        // Save AI Response
        $aiMessage = ConsultationMessage::create([
            'consultation_id' => $consultation->id,
            'role' => 'assistant',
            'message' => $response['text'],
            'extracted_symptoms' => $response['extracted_symptoms'],
            'follow_up_questions' => $response['follow_up'] ?? null,
            'triage_level' => $response['triage_level']
        ]);

        // Mock saving a memory fact if requested (e.g. if the user says "I have migraine")
        if (stripos($request->message, 'migraine') !== false) {
            ConsultationMemory::create([
                'user_id' => $user->id,
                'consultation_id' => $consultation->id,
                'memory_type' => 'symptom',
                'memory_fact' => 'User suffers from migraines'
            ]);
        }

        return response()->json([
            'message' => [
                'role' => 'assistant',
                'text' => $aiMessage->message,
                'follow_up' => $aiMessage->follow_up_questions,
                'triage' => $aiMessage->triage_level
            ],
            'memory_used' => count($memories) > 0
        ]);
    }

    public function history(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $consultations = Consultation::where('user_id', $user->id)
            ->with(['messages' => function($q) {
                $q->orderBy('created_at', 'asc');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'consultations' => $consultations
        ]);
    }

    public function memory(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $memories = ConsultationMemory::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'memory' => $memories
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        $consultation = Consultation::findOrFail($id);
        if ($consultation->user_id !== $user->id) return response()->json(['error' => 'Forbidden'], 403);

        $consultation->delete();
        return response()->json(['success' => true]);
    }
}
