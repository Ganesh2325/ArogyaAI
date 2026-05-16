<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIService
{
    protected $apiKey;
    protected $baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key');
    }

    /**
     * Performs a dynamic chat analysis with context memory and domain restriction.
     */
    public function chat(string $userInput, array $history = []): array
    {
        // 1. Build context from history
        $context = "";
        foreach ($history as $msg) {
            $sender = $msg['sender'] === 'user' ? 'User' : 'Assistant';
            $context .= "{$sender}: {$msg['message_text']}\n";
        }

        // 2. Structured System Prompt
        $systemPrompt = <<<PROMPT
You are an advanced AI medical assistant for ArogyaAI with doctor-level clinical reasoning capabilities.

Your task is to:
1. Analyze symptoms using professional clinical reasoning.
2. Provide a detailed, conversational response that explains potential causes, recommended actions, and safety advice naturally in the text.
3. Use a tone that is empathetic yet clinically accurate.

---
## INSTRUCTIONS (STRICT)

STEP 1: CLINICAL ANALYSIS
- Correlate symptoms with possible conditions internally.
- Assess risk levels based on medical urgency.

STEP 2: RESPONSE GENERATION
Provide a highly structured yet conversational response in the `message` field. Use clear headings for readability:

### Understanding Your Symptoms
[Explain what the user is reporting and the context]

### Potential Causes
[Discuss likely conditions and their relevance to the reported symptoms naturally]

### Recommended Next Steps
[Provide actionable guidance like hydration, rest, or scheduling a doctor's visit]

### When to Seek Emergency Care
[List clear red flags and emergency symptoms]

STEP 3: JSON DATA
Even though we are providing a conversational response, you MUST still return a valid JSON object with the following background data:
- "message": (string) The full conversational analysis from Step 2.
- "triage": (string) Internal risk assessment ("EMERGENCY", "PRIMARY_CARE", or "SELF_CARE").
- "conditions": (array) Internal condition ranking for database storage.
- "next_steps": (string) One clear actionable sentence.
- "follow_up": (string) A single follow-up question.
- "disclaimer": (string) "This is not a medical diagnosis".

---
## RULES
- DO NOT use markdown bold/italics in the message content (except for headings using ###). Use plain text.
- ONLY answer health/medical queries.
- Incorporate triage levels and potential conditions NATURALLY into the text instead of using external cards or meters.

Previous conversation context:
{$context}

User input: "{$userInput}"

Return ONLY valid JSON.
PROMPT;

        try {
            // Add automatic retries (3 times with 1s delay) for transient failures like 503
            $response = Http::retry(3, 1000, function (\Exception $exception, $request) {
                return $exception instanceof \Illuminate\Http\Client\ConnectionException || 
                       ($exception instanceof \Illuminate\Http\Client\RequestException && $exception->response->status() === 503);
            })->post($this->baseUrl . '?key=' . $this->apiKey, [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $systemPrompt]
                        ]
                    ]
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $textResult = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
                Log::info('Gemini Raw Result: ' . $textResult);
                
                // Clean markdown code blocks
                $textResult = preg_replace('/```json\s*|\s*```/', '', $textResult);
                $textResult = trim($textResult);
                
                $decoded = json_decode($textResult, true);
                
                // Defensive check: If decoding failed or result is not an array, treat raw text as message
                if (!is_array($decoded)) {
                    Log::warning('Gemini JSON decode failed. Using raw text.');
                    return [
                        'message' => $textResult,
                        'triage' => 'PRIMARY_CARE',
                        'color_code' => 'YELLOW',
                        'conditions' => [],
                        'next_steps' => "Please consult a healthcare professional for more details.",
                        'follow_up' => "Would you like to elaborate on your symptoms?",
                        'disclaimer' => "This is not a medical diagnosis",
                        'is_rejected' => false
                    ];
                }
                
                // Validate domain restriction from AI response
                if (!isset($decoded['triage']) && isset($decoded['message'])) {
                    return [
                        'message' => $decoded['message'],
                        'is_rejected' => true
                    ];
                }

                $triage = $decoded['triage'] ?? "PRIMARY_CARE";
                $colorCode = 'YELLOW';
                if ($triage === 'EMERGENCY') $colorCode = 'RED';
                if ($triage === 'SELF_CARE') $colorCode = 'GREEN';

                $rawConditions = $decoded['conditions'] ?? [];
                $sanitizedConditions = [];
                if (is_array($rawConditions)) {
                    foreach ($rawConditions as $c) {
                        if (is_array($c)) {
                            $sanitizedConditions[] = [
                                'name' => $c['name'] ?? 'Unknown Condition',
                                'probability' => $c['probability'] ?? 0.5
                            ];
                        } elseif (is_string($c)) {
                            $sanitizedConditions[] = [
                                'name' => $c,
                                'probability' => 0.5
                            ];
                        }
                    }
                }

                return [
                    'message' => $decoded['message'] ?? $textResult,
                    'triage' => $triage,
                    'color_code' => $colorCode,
                    'conditions' => $sanitizedConditions,
                    'next_steps' => $decoded['next_steps'] ?? "Please consult a healthcare professional.",
                    'follow_up' => $decoded['follow_up'] ?? "How long have you been experiencing this?",
                    'disclaimer' => $decoded['disclaimer'] ?? "This is not a medical diagnosis",
                    'is_rejected' => false
                ];
            }

            Log::error('Gemini API Error: ' . $response->body());
            return $this->analyzeLocally($userInput);
        } catch (\Exception $e) {
            Log::error('AIService Exception: ' . $e->getMessage());
            return $this->analyzeLocally($userInput);
        }
    }

    /**
     * Local Rule-Based Analysis (Pseudo-AI)
     * Used when external API is down to ensure 24/7 reliability.
     */
    protected function analyzeLocally(string $input): array
    {
        $input = strtolower($input);
        
        // Red Flag Detection (Emergency)
        $redFlags = ['chest pain', 'breathing', 'unconscious', 'bleeding', 'stroke', 'heart attack', 'severe pain', 'fracture'];
        $isEmergency = false;
        foreach ($redFlags as $flag) {
            if (str_contains($input, $flag)) {
                $isEmergency = true;
                break;
            }
        }

        if ($isEmergency) {
            return [
                'message' => "My analysis engine is currently undergoing maintenance, but based on your description of serious symptoms, I have detected potential red flags.\n\n1. Assessment\n- Severe symptoms detected\n- Potential emergency risk\n\n2. Recommendation\n- Seek immediate medical attention\n- Do not wait for symptoms to worsen\n\n3. Red Flags\n- Symptoms involving vital functions (heart/lungs/neurological)",
                'triage' => 'EMERGENCY',
                'color_code' => 'RED',
                'conditions' => [['name' => 'Acute Medical Emergency', 'probability' => 0.9]],
                'next_steps' => "Call emergency services (911) or go to the nearest ER immediately.",
                'follow_up' => "Are you with someone who can help you right now?",
                'disclaimer' => "Local safety fallback active - This is not a diagnosis",
                'is_rejected' => false
            ];
        }

        // Standard Fallback (Primary Care)
        return [
            'message' => "My analysis engine is busy right now, but I can still provide general guidance. \n\n1. Understanding Your Symptoms\n- General symptoms reported\n- Duration/Severity requires monitoring\n\n2. Recommended Actions\n- Rest and stay hydrated\n- Monitor temperature if fever is suspected\n- Keep a log of symptom changes\n\n3. Next Steps\n- Consult a primary care doctor for a thorough examination.",
            'triage' => 'PRIMARY_CARE',
            'color_code' => 'YELLOW',
            'conditions' => [['name' => 'General Viral/Bacterial Infection', 'probability' => 0.6]],
            'next_steps' => "Schedule an appointment with a general physician.",
            'follow_up' => "Have you noticed any other changes in your health today?",
            'disclaimer' => "Local safety fallback active - This is not a diagnosis",
            'is_rejected' => false
        ];
    }
}
