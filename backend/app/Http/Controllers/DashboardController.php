<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Consultation;
use App\Models\RiskForecast;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Fetch recent consultation
        $recentConsultationModel = Consultation::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        $recentConsultation = null;
        if ($recentConsultationModel) {
            $recentConsultation = [
                'date' => $recentConsultationModel->created_at->format('M d, g:i A'),
                'symptoms' => $recentConsultationModel->chief_complaint ?? 'General Checkup',
                'risk' => $recentConsultationModel->triage_level ?? 'Low',
                'action' => 'Monitor symptoms and follow medical advice.'
            ];
        }

        // Fetch risk forecast or set defaults
        $forecast = RiskForecast::where('user_id', $user->id)
            ->where('health_score', '>', 0)
            ->orderBy('created_at', 'desc')
            ->first();

        $healthScore = $forecast ? $forecast->health_score : 100; // Default to 100 for new users
        
        $riskLevel = 'Low';
        if ($healthScore < 50) $riskLevel = 'High';
        else if ($healthScore < 75) $riskLevel = 'Medium';

        $status = 'Healthy';
        if ($riskLevel === 'High') $status = 'Needs Attention';
        else if ($riskLevel === 'Medium') $status = 'Monitor';

        $trendText = $forecast ? '+2% from last month' : 'No previous data';

        // Dynamic insights based on recent data
        $consultCount = Consultation::where('user_id', $user->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->count();
            
        $insights = [];
        if ($consultCount > 0) {
            $insights[] = [
                'color' => 'blue',
                'text' => "You had <strong>{$consultCount} consultations</strong> this month."
            ];
        } else {
            $insights[] = [
                'color' => 'green',
                'text' => "You have no reported symptoms recently. Keep it up!"
            ];
        }

        if ($healthScore >= 80) {
            $insights[] = [
                'color' => 'green',
                'text' => "Your overall health indicators are <strong>excellent</strong>."
            ];
        } else {
            $insights[] = [
                'color' => 'orange',
                'text' => "Your health score indicates you should schedule a checkup."
            ];
        }

        return response()->json([
            'user' => [
                'first_name' => explode(' ', $user->name)[0],
                'name' => $user->name,
            ],
            'health_metrics' => [
                'score' => $healthScore,
                'risk_level' => $riskLevel,
                'status' => $status,
                'trend' => $trendText
            ],
            'recent_consultation' => $recentConsultation,
            'insights' => $insights
        ]);
    }
}
