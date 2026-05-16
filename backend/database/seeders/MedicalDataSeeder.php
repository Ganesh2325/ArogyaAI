<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Symptom;
use App\Models\Condition;
use Illuminate\Support\Facades\DB;

class MedicalDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Symptoms
        $symptoms = [
            ['name' => 'fever', 'category' => 'General', 'is_red_flag' => false],
            ['name' => 'cough', 'category' => 'Respiratory', 'is_red_flag' => false],
            ['name' => 'headache', 'category' => 'Neurological', 'is_red_flag' => false],
            ['name' => 'chest pain', 'category' => 'Cardiac', 'is_red_flag' => true],
            ['name' => 'shortness of breath', 'category' => 'Respiratory', 'is_red_flag' => true],
            ['name' => 'fatigue', 'category' => 'General', 'is_red_flag' => false],
            ['name' => 'nausea', 'category' => 'Gastrointestinal', 'is_red_flag' => false],
            ['name' => 'sore throat', 'category' => 'Respiratory', 'is_red_flag' => false],
        ];

        foreach ($symptoms as $s) {
            Symptom::updateOrCreate(['name' => $s['name']], $s);
        }

        // 2. Create Conditions
        $conditions = [
            [
                'name' => 'Viral Flu',
                'description' => 'A common viral infection.',
                'severity_level' => 'SELF_CARE',
                'specialist_recommendation' => 'General Physician',
                'symptoms' => [
                    'fever' => 0.8,
                    'cough' => 0.6,
                    'fatigue' => 0.7
                ]
            ],
            [
                'name' => 'Migraine',
                'description' => 'A severe headache.',
                'severity_level' => 'PRIMARY_CARE',
                'specialist_recommendation' => 'Neurologist',
                'symptoms' => [
                    'headache' => 0.9,
                    'nausea' => 0.5
                ]
            ],
            [
                'name' => 'COVID-19',
                'description' => 'Respiratory illness.',
                'severity_level' => 'PRIMARY_CARE',
                'specialist_recommendation' => 'Pulmonologist',
                'symptoms' => [
                    'fever' => 0.9,
                    'cough' => 0.8,
                    'sore throat' => 0.6,
                    'fatigue' => 0.7
                ]
            ],
            [
                'name' => 'Common Cold',
                'description' => 'Mild respiratory infection.',
                'severity_level' => 'SELF_CARE',
                'specialist_recommendation' => 'General Physician',
                'symptoms' => [
                    'cough' => 0.5,
                    'sore throat' => 0.7
                ]
            ],
            [
                'name' => 'Angina',
                'description' => 'Chest pain due to reduced blood flow to the heart.',
                'severity_level' => 'EMERGENCY',
                'specialist_recommendation' => 'Cardiologist',
                'symptoms' => [
                    'chest pain' => 1.0,
                    'shortness of breath' => 0.7
                ]
            ]
        ];

        foreach ($conditions as $c) {
            $condition = Condition::updateOrCreate(
                ['name' => $c['name']],
                [
                    'description' => $c['description'],
                    'severity_level' => $c['severity_level'],
                    'specialist_recommendation' => $c['specialist_recommendation']
                ]
            );

            // Map symptoms
            foreach ($c['symptoms'] as $sName => $weight) {
                $symptom = Symptom::where('name', $sName)->first();
                if ($symptom) {
                    DB::table('symptom_condition_map')->updateOrInsert(
                        ['condition_id' => $condition->id, 'symptom_id' => $symptom->id],
                        ['weight' => $weight]
                    );
                }
            }
        }

        // Create a test user
        \App\Models\User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => \Illuminate\Support\Facades\Hash::make('password'),
            ]
        );
    }
}
