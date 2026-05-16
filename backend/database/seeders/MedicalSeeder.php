<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Symptom;
use App\Models\Condition;
use Illuminate\Support\Facades\DB;

class MedicalSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Symptoms
        $symptoms = [
            ['name' => 'fever', 'is_red_flag' => false],
            ['name' => 'cough', 'is_red_flag' => false],
            ['name' => 'headache', 'is_red_flag' => false],
            ['name' => 'chest pain', 'is_red_flag' => true],
            ['name' => 'shortness of breath', 'is_red_flag' => true],
            ['name' => 'fatigue', 'is_red_flag' => false],
            ['name' => 'nausea', 'is_red_flag' => false],
        ];

        foreach ($symptoms as $s) {
            Symptom::create($s);
        }

        // 2. Conditions
        $flu = Condition::create(['name' => 'Viral Flu', 'specialist_recommendation' => 'General Physician']);
        $migraine = Condition::create(['name' => 'Migraine', 'specialist_recommendation' => 'Neurologist']);
        $covid = Condition::create(['name' => 'COVID-19', 'specialist_recommendation' => 'Infectious Disease Specialist']);

        // 3. Mappings
        DB::table('condition_symptom')->insert([
            ['condition_id' => $flu->id, 'symptom_id' => Symptom::where('name', 'fever')->first()->id, 'weight' => 0.8],
            ['condition_id' => $flu->id, 'symptom_id' => Symptom::where('name', 'cough')->first()->id, 'weight' => 0.6],
            ['condition_id' => $migraine->id, 'symptom_id' => Symptom::where('name', 'headache')->first()->id, 'weight' => 0.9],
            ['condition_id' => $migraine->id, 'symptom_id' => Symptom::where('name', 'nausea')->first()->id, 'weight' => 0.5],
            ['condition_id' => $covid->id, 'symptom_id' => Symptom::where('name', 'fever')->first()->id, 'weight' => 0.7],
            ['condition_id' => $covid->id, 'symptom_id' => Symptom::where('name', 'shortness of breath')->first()->id, 'weight' => 0.9],
        ]);
    }
}
