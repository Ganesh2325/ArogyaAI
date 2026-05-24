<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ConsultationMessage;
use App\Models\SymptomScan;
use App\Models\RiskForecast;
use Carbon\Carbon;
use App\Services\AIAssistantService;

class RiskPredictionController extends Controller
{
    protected $aiService;

    public function __construct(AIAssistantService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function forecast(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        // Check cache: Do we have a valid forecast less than 24 hours old?
        $forceRefresh = $request->query('refresh') === 'true';
        if (!$forceRefresh) {
            $latestForecast = RiskForecast::where('user_id', $user->id)
                ->where('health_score', '>', 0)
                ->where('created_at', '>=', Carbon::now()->subHours(24))
                ->orderBy('created_at', 'desc')
                ->first();

            if ($latestForecast) {
                return response()->json([
                    'health_score' => $latestForecast->health_score,
                    'forecast_data' => $latestForecast->forecast_data,
                    'cached' => true,
                    'last_updated' => $latestForecast->created_at->diffForHumans()
                ]);
            }
        }

        // Generate new forecast by aggregating 6 months of data
        $sixMonthsAgo = Carbon::now()->subMonths(6);

        $consultations = ConsultationMessage::whereHas('consultation', function($q) use ($user) {
            $q->where('user_id', $user->id);
        })->whereNotNull('extracted_symptoms')
          ->where('created_at', '>=', $sixMonthsAgo)
          ->get();

        $scans = SymptomScan::where('user_id', $user->id)
            ->where('created_at', '>=', $sixMonthsAgo)
            ->get();

        if ($consultations->isEmpty() && $scans->isEmpty()) {
            return response()->json([
                'health_score' => 100,
                'forecast_data' => [
                    'breakdown' => 'You do not have any logged consultations or symptom scans yet. ArogyaAI requires historical data to generate chronic risk forecasts.',
                    'preventative_actions' => "- Start a clinical consultation in the Chat tab.\n- Upload your medical reports or scans in the Symptom Scanner tab."
                ],
                'cached' => false,
                'last_updated' => 'Just now'
            ]);
        }

        $medicalProfile = "Consultations in last 6 months:\n";
        foreach ($consultations as $msg) {
            $symptoms = implode(', ', $msg->extracted_symptoms ?? []);
            $medicalProfile .= "- Date: {$msg->created_at->format('Y-m-d')}, Symptoms: {$symptoms}, Triage: {$msg->triage_level}\n";
        }

        $medicalProfile .= "\nSymptom Scans in last 6 months:\n";
        foreach ($scans as $scan) {
            $visual = $scan->ai_analysis['visual_analysis'] ?? 'Unknown';
            $medicalProfile .= "- Date: {$scan->created_at->format('Y-m-d')}, Observation: {$visual}, Risk: {$scan->risk_level}\n";
        }

        try {
            // Call Gemini
            $forecastResult = $this->aiService->generateRiskForecast($medicalProfile);

            // Double check that we received a valid score
            if (!isset($forecastResult['health_score']) || $forecastResult['health_score'] <= 0) {
                throw new \Exception("Invalid health score returned from Gemini API");
            }

            // Save to cache
            $forecast = RiskForecast::create([
                'user_id' => $user->id,
                'health_score' => $forecastResult['health_score'],
                'forecast_data' => [
                    'breakdown' => $forecastResult['breakdown'],
                    'preventative_actions' => $forecastResult['preventative_actions']
                ]
            ]);

            return response()->json([
                'health_score' => $forecast->health_score,
                'forecast_data' => $forecast->forecast_data,
                'cached' => false,
                'last_updated' => 'Just now'
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Failed to generate risk forecast: " . $e->getMessage());

            // If the user has a previous valid forecast, return that instead of failing or setting to 0
            $lastForecast = RiskForecast::where('user_id', $user->id)
                ->where('health_score', '>', 0)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($lastForecast) {
                return response()->json([
                    'health_score' => $lastForecast->health_score,
                    'forecast_data' => $lastForecast->forecast_data,
                    'cached' => true,
                    'last_updated' => $lastForecast->created_at->diffForHumans()
                ]);
            }

            // If no previous forecast, fallback to default 100
            return response()->json([
                'health_score' => 100,
                'forecast_data' => [
                    'breakdown' => 'We are temporarily unable to analyze your health profile due to temporary system limits. Your default score is 100.',
                    'preventative_actions' => "- Start a clinical consultation in the Chat tab.\n- Upload your medical reports or scans in the Symptom Scanner tab."
                ],
                'cached' => false,
                'last_updated' => 'Just now'
            ]);
        }
    }
}
