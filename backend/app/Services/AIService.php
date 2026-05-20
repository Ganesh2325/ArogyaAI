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
2. Provide a detailed, clinical response that explains potential causes, recommended actions, and safety advice in clean bullet points, highlighting extremely key warnings in bold font.
3. Use a tone that is empathetic yet clinically accurate.

---
## INSTRUCTIONS (STRICT)

STEP 1: CLINICAL ANALYSIS
- Correlate symptoms with possible conditions internally.
- Assess risk levels based on medical urgency.

STEP 2: RESPONSE GENERATION
Provide a highly structured response in the `message` field. Use clear headings for readability and present insights in bullet points, using bold text (**warning**) for very important guidance:

### Understanding Your Symptoms
- [Explain what the user is reporting and the context]
- [Use bullet points to list symptoms]

### Potential Causes
- [Discuss potential conditions and their relevance to reported symptoms in bullet points]
- [Highlight key symptoms or conditions in **bold**]

### Recommended Next Steps
- [Provide actionable guidance like hydration, rest, or scheduling a doctor's visit in bullet points]
- [Make very important next steps **bold**]

### When to Seek Emergency Care
- [List clear red flags and emergency symptoms in bullet points]
- [Make life-threatening symptoms and emergency warnings **bold**]

STEP 3: JSON DATA
Even though we are providing a conversational response, you MUST still return a valid JSON object with the following background data:
- "message": (string) The full conversational analysis from Step 2 containing the headings and bullet points with bold markdown.
- "triage": (string) Internal risk assessment ("EMERGENCY", "PRIMARY_CARE", or "SELF_CARE").
- "conditions": (array) Internal condition ranking for database storage.
- "next_steps": (string) One clear actionable sentence.
- "follow_up": (string) A single follow-up question.
- "disclaimer": (string) "This is not a medical diagnosis".

---
## RULES
- ALWAYS format insights using clear bullet points. Use bold markdown (**text**) to highlight critical medical terms, warnings, and urgent advice so they are easily accessible by the user.
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
     * Local Fallback - Disabled in production to prevent simulated, mock diagnosis responses.
     */
    protected function analyzeLocally(string $input): array
    {
        Log::error("Local Fallback Triggered: Unable to communicate with Gemini Clinical Reasoning Engine.");
        throw new \Exception("ArogyaAI clinical reasoning engine is currently unreachable. Please verify your internet connection or check your GEMINI_API_KEY configuration.");
    }
}
