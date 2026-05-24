<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Consultation;
use App\Models\ConsultationMessage;
use App\Models\SymptomScan;
use Carbon\Carbon;

class HealthAnalyticsSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();
        if (!$user) return;

        // Generate 6 months of dummy data
        $symptoms = ['Headache', 'Fever', 'Cough', 'Back Pain', 'Skin Rash', 'Fatigue', 'Nausea'];
        $riskLevels = ['LOW', 'LOW', 'LOW', 'MODERATE', 'MODERATE', 'HIGH', 'EMERGENCY'];
        
        // Seed 15 Consultations
        for ($i = 0; $i < 15; $i++) {
            $daysAgo = rand(1, 180);
            $createdAt = Carbon::now()->subDays($daysAgo);
            
            $consultation = Consultation::create([
                'user_id' => $user->id,
                'title' => 'Consultation ' . $createdAt->format('M d, Y'),
                'created_at' => $createdAt,
                'updated_at' => $createdAt
            ]);

            $selectedSymptom = $symptoms[array_rand($symptoms)];
            $selectedRisk = $riskLevels[array_rand($riskLevels)];

            ConsultationMessage::create([
                'consultation_id' => $consultation->id,
                'role' => 'user',
                'message' => 'I have a severe ' . $selectedSymptom,
                'created_at' => $createdAt,
                'updated_at' => $createdAt
            ]);

            ConsultationMessage::create([
                'consultation_id' => $consultation->id,
                'role' => 'assistant',
                'message' => 'Based on your symptoms, this could be related to...',
                'triage_level' => $selectedRisk,
                'extracted_symptoms' => [$selectedSymptom],
                'created_at' => $createdAt->copy()->addMinutes(2),
                'updated_at' => $createdAt->copy()->addMinutes(2)
            ]);
        }

        // Seed 5 Scans
        for ($i = 0; $i < 5; $i++) {
            $daysAgo = rand(1, 180);
            $createdAt = Carbon::now()->subDays($daysAgo);
            $selectedRisk = $riskLevels[array_rand($riskLevels)];

            SymptomScan::create([
                'user_id' => $user->id,
                'image_path' => 'dummy_path.jpg',
                'ai_analysis' => [
                    'visual_analysis' => 'Skin irritation observed.',
                    'potential_conditions' => "Dermatitis\nAllergic Reaction",
                    'recommendations' => 'Apply hydrocortisone cream'
                ],
                'risk_level' => $selectedRisk,
                'created_at' => $createdAt,
                'updated_at' => $createdAt
            ]);
        }
    }
}
