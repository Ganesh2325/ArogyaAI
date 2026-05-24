<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AIAssistantService
{
    protected $apiKey;

    public function __construct()
    {
        $this->apiKey = env('GEMINI_API_KEY');
    }

    /**
     * Send a message to Gemini with conversation history and user memory.
     */
    public function generateConsultationResponse($message, $history = [], $memoryContext = "")
    {
        if (!$this->apiKey) {
            Log::error("Gemini API key is missing.");
            return [
                'text' => "System Error: API Key missing.",
                'extracted_symptoms' => [],
                'triage_level' => 'UNKNOWN'
            ];
        }

        $systemPrompt = "You are ArogyaAI, an advanced medical AI assistant.
Your goal is to conduct a thorough, high-quality clinical consultation. Since patients often struggle to describe their symptoms accurately, you must provide comprehensive, detailed, and empathetic clinical analysis.

CRITICAL: Review the conversation history. Do NOT repeat any explanations, definitions, or general text that has already been mentioned in previous turns. Keep each response progressive and focused on new details or follow-ups.

MEMORY CONTEXT: 
$memoryContext

When a user presents symptoms or asks 'what is this disease', analyze the symptoms deeply and cover every clinical possibility (ranging from common and benign conditions to moderate/severe differential diagnoses). Explain each potential cause clearly, detailing the medical mechanism and what other symptoms would support or rule it out. 

Do NOT include phrases like 'Why suspected:' or similar sub-headings/labels under the potential causes. Present each cause in a single, fluid explanation.

IMPORTANT: You must structure your final response exactly in this format using these exact headings:

### Understanding Symptoms
Provide a detailed, comprehensive clinical summary of the symptoms described by the patient. Explain how they might correlate, their general medical implications, and show deep clinical empathy.

### Potential Causes
List all potential causes and differential diagnoses, covering every logical possibility based on the user's description. Prefix each item with '- '. For each cause, provide a clean, descriptive paragraph without sub-headings like 'Why suspected:'.

### Recommended Next Steps
Provide detailed, actionable preliminary advice. Explain how the patient should monitor their symptoms, outline home care/first-aid guidelines, specify what type of medical specialist they should consult, and explain how to seek appropriate care. Prefix items with '- '.

### Follow-Up Questions
Ask 2-3 highly targeted clinical follow-up questions to narrow down the possible diagnoses (e.g., onset speed, character of pain, relieving/aggravating factors). Prefix each item with '- '.
";

        $contents = [];
        foreach ($history as $h) {
            if ($h['role'] === 'system') continue;
            $contents[] = [
                "role" => $h['role'] === 'assistant' ? 'model' : 'user',
                "parts" => [["text" => $h['message']]]
            ];
        }

        // Add current message
        $contents[] = [
            "role" => "user",
            "parts" => [["text" => $message]]
        ];

        try {
            $response = Http::retry(3, 1000, function (\Exception $exception, $request) {
                return $exception instanceof \Illuminate\Http\Client\ConnectionException || 
                       ($exception instanceof \Illuminate\Http\Client\RequestException && $exception->response->status() === 503);
            })->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$this->apiKey}", [
                "systemInstruction" => [
                    "parts" => [["text" => $systemPrompt]]
                ],
                "contents" => $contents,
                "generationConfig" => [
                    "temperature" => 0.4,
                    "maxOutputTokens" => 4096,
                ]
            ]);

            if ($response->failed()) {
                Log::error("Gemini API Error: " . $response->body());
                return ['text' => "I am currently experiencing technical difficulties. Please try again later.", 'extracted_symptoms' => [], 'triage_level' => 'UNKNOWN'];
            }

            $data = $response->json();
            $responseText = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

            // Detect emergency
            $triage = 'ROUTINE';
            $emergencyKeywords = ['chest pain', 'stroke', 'bleeding', 'breath', 'unconscious', 'faint', 'severe', 'worst headache'];
            foreach ($emergencyKeywords as $keyword) {
                if (stripos($message, $keyword) !== false) {
                    $triage = 'EMERGENCY';
                    break;
                }
            }

            // Extract follow-up questions
            $followUp = '';
            $mainText = $responseText;
            $parts = preg_split('/###\s*Follow-?Up\s*Questions?:?/i', $responseText);
            if (count($parts) > 1) {
                $mainText = trim($parts[0]);
                $followUp = trim($parts[1]);
            }

            return [
                'text' => $mainText,
                'follow_up' => $followUp,
                'extracted_symptoms' => $this->extractSymptoms($message), // basic extraction
                'triage_level' => $triage
            ];

        } catch (\Exception $e) {
            Log::error("Exception in AIAssistantService: " . $e->getMessage());
            return ['text' => "An unexpected error occurred.", 'extracted_symptoms' => [], 'triage_level' => 'UNKNOWN'];
        }
    }

    private function extractSymptoms($text)
    {
        $commonSymptoms = ['headache', 'fever', 'cough', 'nausea', 'vomiting', 'pain', 'fatigue', 'rash'];
        $found = [];
        foreach ($commonSymptoms as $s) {
            if (stripos($text, $s) !== false) {
                $found[] = $s;
            }
        }
        return $found;
    }

    /**
     * Analyze a medical document/image using Gemini Multimodal API
     */
    public function analyzeMedicalDocument($fileBase64, $mimeType)
    {
        if (!$this->apiKey) {
            Log::error("Gemini API key is missing.");
            return [
                'error' => "System Error: API Key missing."
            ];
        }

        // Extremely robust JSON extraction prompt to ensure structure
        $systemPrompt = "You are ArogyaAI, an advanced medical AI analyzer with vision and document extraction capabilities.
Analyze this uploaded file (which could be an image, MRI, X-ray, prescription, or PDF medical report/blood test).
You must output YOUR ENTIRE RESPONSE as a valid JSON object. Do not include markdown code block formatting like ```json ... ```, just output the raw JSON directly.

If the document is a Blood Report or CBC, extract the specific values.
If it is a Prescription, extract the medicines.
If it is a general medical report or scan, provide a summary and visual findings.

You MUST use this EXACT JSON schema:

{
    \"scan_type\": \"BLOOD_REPORT\" | \"PRESCRIPTION\" | \"IMAGE_SCAN\" | \"PDF_DOCUMENT\",
    \"summary\": \"A short 1-2 sentence summary of the main finding\",
    \"risk_level\": \"LOW\" | \"MODERATE\" | \"HIGH\" | \"CRITICAL\",
    \"confidence_score\": 95, // integer 0-100
    \"analysis\": {
        // ONLY include 'blood_metrics' if scan_type is BLOOD_REPORT
        \"blood_metrics\": [
            { \"name\": \"Hemoglobin\", \"value\": \"14.2 g/dL\", \"status\": \"Normal\" | \"Monitor\" | \"Consult Doctor\" },
            { \"name\": \"WBC\", \"value\": \"...\", \"status\": \"...\" }
            // Extract as many key markers as you can find
        ],
        // ONLY include 'medicines' if scan_type is PRESCRIPTION
        \"medicines\": [
            { \"name\": \"Paracetamol\", \"dosage\": \"500mg\", \"timing\": \"Twice daily\", \"duration\": \"5 days\", \"purpose\": \"Pain relief\" }
        ],
        // ONLY include 'visual_findings' if scan_type is IMAGE_SCAN
        \"visual_findings\": \"Detailed description of visual abnormalities seen in the MRI/Xray/Rash\",
        
        \"potential_conditions\": [\"Condition A\", \"Condition B\"],
        \"recommendations\": [\"Action 1\", \"Action 2\"],
        \"suggested_specialists\": [\"Cardiologist\", \"Dermatologist\"]
    }
}
";

        try {
            $response = Http::retry(3, 1000, function (\Exception $exception, $request) {
                return $exception instanceof \Illuminate\Http\Client\ConnectionException || 
                       ($exception instanceof \Illuminate\Http\Client\RequestException && $exception->response->status() === 503);
            })->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$this->apiKey}", [
                "systemInstruction" => [
                    "parts" => [["text" => $systemPrompt]]
                ],
                "contents" => [
                    [
                        "role" => "user",
                        "parts" => [
                            [
                                "inlineData" => [
                                    "mimeType" => $mimeType,
                                    "data" => $fileBase64
                                ]
                            ],
                            [
                                "text" => "Please analyze this medical document carefully."
                            ]
                        ]
                    ]
                ],
                "generationConfig" => [
                    "temperature" => 0.2,
                    "maxOutputTokens" => 4096,
                    "responseMimeType" => "application/json" // Force JSON output
                ]
            ]);

            if ($response->failed()) {
                Log::error("Gemini Multimodal API Error: " . $response->body());
                return ['error' => "Failed to analyze document."];
            }

            $data = $response->json();
            $responseText = $data['candidates'][0]['content']['parts'][0]['text'] ?? '{}';
            
            // Clean markdown block if gemini hallucinated it despite responseMimeType
            $responseText = preg_replace('/```json\s*(.*?)\s*```/is', '$1', $responseText);
            
            $decoded = json_decode($responseText, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error("Failed to parse Gemini JSON: " . $responseText);
                // Fallback struct
                return [
                    'scan_type' => 'IMAGE_SCAN',
                    'summary' => 'Could not fully extract structured data.',
                    'risk_level' => 'UNKNOWN',
                    'confidence_score' => 0,
                    'analysis' => [
                        'visual_findings' => $responseText,
                        'potential_conditions' => [],
                        'recommendations' => [],
                        'suggested_specialists' => []
                    ]
                ];
            }

            return $decoded;

        } catch (\Exception $e) {
            Log::error("Exception in AIAssistantService Document Analysis: " . $e->getMessage());
            return ['error' => "An unexpected error occurred."];
        }
    }

    /**
     * Generate long-term risk prediction based on historical medical profile
     */
    public function generateRiskForecast($medicalProfile)
    {
        if (!$this->apiKey) {
            Log::error("Gemini API key is missing.");
            return [
                'health_score' => 85,
                'breakdown' => "System Error: API Key missing.",
                'preventative_actions' => "Unable to generate actions."
            ];
        }

        $systemPrompt = "You are ArogyaAI, an advanced preventative care physician.
Analyze the following 6-month medical history for a patient.
Your goal is to forecast potential long-term chronic health risks based on the frequency and severity of their reported symptoms, scans, and follow-ups.

Provide a structured response exactly like this:
### Health Score
[Provide a single integer between 1 and 100 representing overall health stability based on the data. 100 is perfect health.]

### Risk Breakdown
[Provide a concise 3-4 sentence paragraph analyzing the primary long-term risks (e.g. chronic migraines, hypertension risk, immune system weakness) based specifically on the patterns in the data.]

### Preventative Actions
- [Action 1]
- [Action 2]
- [Action 3]

Medical Profile Data:
" . $medicalProfile;

        try {
            $response = Http::retry(3, 1000, function (\Exception $exception, $request) {
                return $exception instanceof \Illuminate\Http\Client\ConnectionException || 
                       ($exception instanceof \Illuminate\Http\Client\RequestException && $exception->response->status() === 503);
            })->withHeaders([
                'Content-Type' => 'application/json',
            ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$this->apiKey}", [
                "contents" => [
                    ["role" => "user", "parts" => [["text" => $systemPrompt]]]
                ],
                "generationConfig" => [
                    "temperature" => 0.5,
                    "maxOutputTokens" => 4096,
                ]
            ]);

            if ($response->failed()) {
                Log::error("Gemini Risk Prediction API Error: " . $response->body());
                throw new \Exception("Gemini API call failed: " . $response->status());
            }

            $data = $response->json();
            $responseText = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

            // Extract Score
            $score = 80;
            if (preg_match('/### Health Score\s*(\d+)/i', $responseText, $matches)) {
                $score = (int) $matches[1];
            }

            // Extract Breakdown
            $breakdown = '';
            if (preg_match('/### Risk Breakdown\s*(.*?)(?=###|$)/is', $responseText, $matches)) {
                $breakdown = trim($matches[1]);
            }

            // Extract Actions
            $actions = '';
            if (preg_match('/### Preventative Actions\s*(.*?)(?=###|$)/is', $responseText, $matches)) {
                $actions = trim($matches[1]);
            }

            return [
                'health_score' => $score,
                'breakdown' => $breakdown,
                'preventative_actions' => $actions
            ];

        } catch (\Exception $e) {
            Log::error("Exception in AIAssistantService Risk Prediction: " . $e->getMessage());
            throw $e;
        }
    }
}
