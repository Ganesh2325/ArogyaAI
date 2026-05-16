<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AIService;
use App\Services\TriageEngine;
use App\Models\Consultation;

class AnalyzeController extends Controller
{
    protected $aiService;
    protected $triageEngine;

    public function __construct(AIService $aiService, TriageEngine $triageEngine)
    {
        $this->aiService = $aiService;
        $this->triageEngine = $triageEngine;
    }

    public function analyze(Request $request)
    {
        $request->validate([
            'input' => 'required|string|min:3',
        ]);

        $userInput = $request->input;

        // 1. Extract Symptoms using AI
        $aiResult = $this->aiService->extractSymptoms($userInput);
        
        if (!$aiResult) {
            return response()->json(['error' => 'AI processing failed. Please try again.'], 500);
        }

        $extractedSymptoms = $aiResult['symptoms'] ?? [];
        $followUp = $aiResult['follow_up'] ?? null;

        // 2. Run Triage Engine
        $triageResult = $this->triageEngine->analyze($extractedSymptoms);

        // 3. Save Consultation (if logged in)
        if (auth('sanctum')->check()) {
            Consultation::create([
                'user_id' => auth('sanctum')->id(),
                'user_input' => $userInput,
                'extracted_symptoms' => $extractedSymptoms,
                'triage_level' => $triageResult['triage_level'],
                'possible_conditions' => $triageResult['conditions'],
                'actionable_steps' => $triageResult['next_steps'],
                'is_completed' => true
            ]);
        }

        return response()->json([
            'extracted_symptoms' => $extractedSymptoms,
            'follow_up' => $followUp,
            'triage' => $triageResult['triage_level'],
            'conditions' => $triageResult['conditions'],
            'next_steps' => $triageResult['next_steps'],
            'color_code' => $triageResult['color_code']
        ]);
    }
}
