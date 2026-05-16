<?php

namespace App\Services;

use App\Models\Symptom;
use App\Models\Condition;
use App\Models\Consultation;
use App\Models\Prediction;
use App\Models\Message;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DiagnosisService
{
    protected $aiService;

    public function __construct(AIService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * Main orchestration method for diagnosis.
     */
    public function analyze(string $userInput, int $userId)
    {
        // 1. AI Analysis (Extraction + Explanation + Follow-up)
        $aiAnalysis = $this->aiService->analyzeInput($userInput);
        $symptomNames = $aiAnalysis['symptoms'];
        
        // 2. Detect Red Flags (Safety Rule #1: Emergency Override)
        $hasEmergency = $this->detectRedFlags($symptomNames);
        
        // 3. Predict Conditions
        $conditions = $this->predictConditions($symptomNames);
        
        // 4. Calculate Severity (Safety Rule #3: Conservative Bias)
        $triageLevel = $this->calculateSeverity($conditions, $hasEmergency);
        
        // 5. Generate Response & Save Everything
        return $this->generateResponse($userInput, $userId, $aiAnalysis, $conditions, $triageLevel);
    }

    public function detectRedFlags(array $symptomNames): bool
    {
        $redFlags = Symptom::where('is_red_flag', true)->pluck('name')->toArray();
        
        foreach ($symptomNames as $userSymptom) {
            foreach ($redFlags as $flag) {
                if (stripos($userSymptom, $flag) !== false || stripos($flag, $userSymptom) !== false) {
                    return true;
                }
            }
        }
        
        return false;
    }

    public function predictConditions(array $symptomNames): array
    {
        if (empty($symptomNames)) {
            return [];
        }

        $matchedSymptomIds = [];
        $dbSymptoms = Symptom::all();
        
        foreach ($symptomNames as $userSymptom) {
            foreach ($dbSymptoms as $dbSymptom) {
                if (stripos($userSymptom, $dbSymptom->name) !== false || stripos($dbSymptom->name, $userSymptom) !== false) {
                    $matchedSymptomIds[] = $dbSymptom->id;
                }
            }
        }

        if (empty($matchedSymptomIds)) {
            return [];
        }

        $results = DB::table('symptom_condition_map')
            ->join('conditions', 'conditions.id', '=', 'symptom_condition_map.condition_id')
            ->whereIn('symptom_condition_map.symptom_id', array_unique($matchedSymptomIds))
            ->select('conditions.name', 'conditions.specialist_recommendation', DB::raw('SUM(weight) as score'))
            ->groupBy('conditions.name', 'conditions.specialist_recommendation')
            ->orderByDesc('score')
            ->limit(5)
            ->get();

        $totalScore = $results->sum('score');
        
        return $results->map(function ($row) use ($totalScore) {
            return [
                'name' => $row->name,
                'specialist' => $row->specialist_recommendation ?? 'General Physician',
                'probability' => $totalScore > 0 ? round($row->score / $totalScore, 2) : 0
            ];
        })->toArray();
    }

    public function calculateSeverity(array $conditions, bool $hasEmergency): string
    {
        if ($hasEmergency) {
            return 'EMERGENCY';
        }

        if (empty($conditions)) {
            return 'PRIMARY_CARE';
        }

        $highestProb = $conditions[0]['probability'] ?? 0;

        if ($highestProb < 0.4) {
            return 'PRIMARY_CARE';
        }

        return 'SELF_CARE';
    }

    public function generateResponse(string $userInput, int $userId, array $aiAnalysis, array $conditions, string $triage)
    {
        $nextSteps = $this->getNextSteps($triage);
        $specialist = $conditions[0]['specialist'] ?? 'General Physician';
        $disclaimer = "This is not a medical diagnosis. Please consult a professional.";
        
        // Detailed AI Response (causes, precautions)
        $aiMessageText = "{$aiAnalysis['explanation']}\n\nBased on my analysis ({$triage}), I recommend: {$nextSteps} with a {$specialist}. {$disclaimer}";

        // 1. Create Consultation
        $consultation = Consultation::create([
            'user_id' => $userId,
            'symptoms_input' => $aiAnalysis['symptoms'],
            'triage_result' => $triage,
            'is_completed' => true
        ]);

        // 2. Save Messages
        Message::create([
            'consultation_id' => $consultation->id,
            'sender' => 'user',
            'message_text' => $userInput
        ]);

        Message::create([
            'consultation_id' => $consultation->id,
            'sender' => 'ai',
            'message_text' => "{$aiMessageText}\n\n{$aiAnalysis['follow_up']}"
        ]);

        // 3. Save Predictions
        foreach ($conditions as $cond) {
            Prediction::create([
                'consultation_id' => $consultation->id,
                'condition_name' => $cond['name'],
                'probability' => $cond['probability']
            ]);
        }

        return [
            'consultation_id' => $consultation->id,
            'triage' => $triage,
            'color_code' => $this->getColorCode($triage),
            'conditions' => $conditions,
            'explanation' => $aiAnalysis['explanation'],
            'next_steps' => "{$nextSteps} with a {$specialist}.",
            'follow_up' => $aiAnalysis['follow_up'],
            'disclaimer' => $disclaimer
        ];
    }

    protected function getColorCode(string $triage): string
    {
        return match ($triage) {
            'EMERGENCY' => 'RED',
            'PRIMARY_CARE' => 'YELLOW',
            'SELF_CARE' => 'GREEN',
            default => 'BLUE'
        };
    }

    protected function getNextSteps(string $triage): string
    {
        return match ($triage) {
            'EMERGENCY' => 'Seek immediate medical attention at the nearest emergency room.',
            'PRIMARY_CARE' => 'Schedule an appointment soon.',
            'SELF_CARE' => 'Monitor your symptoms and rest. If they worsen, seek medical advice.',
            default => 'Consult with a healthcare professional.'
        };
    }
}
