<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ConsultationMessage;
use App\Models\SymptomScan;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class HealthAnalyticsController extends Controller
{
    public function metrics(Request $request)
    {
        $user = $request->user();
        if (!$user) return response()->json(['error' => 'Unauthorized'], 401);

        $userId = $user->id;
        $sixMonthsAgo = Carbon::now()->subMonths(6);

        // 1. Overview Cards Data
        $totalScans = SymptomScan::where('user_id', $userId)->count();
        
        $activeRisks = ConsultationMessage::whereHas('consultation', function($q) use ($userId) {
            $q->where('user_id', $userId);
        })
        ->whereIn('triage_level', ['HIGH', 'EMERGENCY'])
        ->where('created_at', '>=', Carbon::now()->subDays(30))
        ->count();

        $activeRisks += SymptomScan::where('user_id', $userId)
        ->whereIn('risk_level', ['HIGH', 'EMERGENCY'])
        ->where('created_at', '>=', Carbon::now()->subDays(30))
        ->count();

        $recentConsultations = \App\Models\Consultation::where('user_id', $userId)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->count();

        // 2. Risk Timeline Chart Data
        // Aggregate risk levels over the last 6 months
        $timelineData = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthStart = Carbon::now()->subMonths($i)->startOfMonth();
            $monthEnd = Carbon::now()->subMonths($i)->endOfMonth();
            $monthName = $monthStart->format('M');

            $highRisks = ConsultationMessage::whereHas('consultation', function($q) use ($userId) {
                $q->where('user_id', $userId);
            })->whereIn('triage_level', ['HIGH', 'EMERGENCY'])
              ->whereBetween('created_at', [$monthStart, $monthEnd])->count();
              
            $highRisks += SymptomScan::where('user_id', $userId)
              ->whereIn('risk_level', ['HIGH', 'EMERGENCY'])
              ->whereBetween('created_at', [$monthStart, $monthEnd])->count();

            $lowRisks = ConsultationMessage::whereHas('consultation', function($q) use ($userId) {
                $q->where('user_id', $userId);
            })->whereIn('triage_level', ['LOW', 'MODERATE'])
              ->whereBetween('created_at', [$monthStart, $monthEnd])->count();
              
            $lowRisks += SymptomScan::where('user_id', $userId)
              ->whereIn('risk_level', ['LOW', 'MODERATE'])
              ->whereBetween('created_at', [$monthStart, $monthEnd])->count();

            $timelineData[] = [
                'name' => $monthName,
                'High Risk' => $highRisks,
                'Routine' => $lowRisks
            ];
        }

        // 3. Symptom Frequency Data
        $symptomCounts = [];
        $messages = ConsultationMessage::whereHas('consultation', function($q) use ($userId) {
            $q->where('user_id', $userId);
        })->whereNotNull('extracted_symptoms')->get();

        foreach ($messages as $msg) {
            $symptoms = $msg->extracted_symptoms;
            if (is_array($symptoms)) {
                foreach ($symptoms as $symp) {
                    $symp = ucwords(strtolower(trim($symp)));
                    if (isset($symptomCounts[$symp])) {
                        $symptomCounts[$symp]++;
                    } else {
                        $symptomCounts[$symp] = 1;
                    }
                }
            }
        }

        arsort($symptomCounts);
        $topSymptoms = array_slice($symptomCounts, 0, 6, true);
        
        $symptomRadarData = [];
        foreach ($topSymptoms as $name => $count) {
            $symptomRadarData[] = [
                'subject' => $name,
                'A' => $count,
                'fullMark' => max($symptomCounts) + 2
            ];
        }

        return response()->json([
            'overview' => [
                'total_scans' => $totalScans,
                'active_risks' => $activeRisks,
                'recent_consultations' => $recentConsultations
            ],
            'timeline' => $timelineData,
            'symptoms' => $symptomRadarData
        ]);
    }
}
