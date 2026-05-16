<?php

namespace App\Services;

use App\Models\Symptom;
use App\Models\Condition;
use Illuminate\Support\Facades\DB;

class TriageEngine
{
    /**
     * Triage user symptoms into risk levels.
     */
    public function analyze(array $extractedSymptoms)
    {
        // 1. Red Flag Detection (Highest Priority)
        if ($this->hasRedFlags($extractedSymptoms)) {
            return [
                'triage_level' => 'EMERGENCY',
                'conditions' => $this->calculateConditions($extractedSymptoms),
                'next_steps' => 'Go to the nearest emergency room immediately.',
                'color_code' => 'RED'
            ];
        }

        $conditions = $this->calculateConditions($extractedSymptoms);
        
        // 2. Severity Classification
        $highestProb = $conditions[0]['probability'] ?? 0;
        
        if ($highestProb > 0.7) {
            return [
                'triage_level' => 'PRIMARY_CARE',
                'conditions' => $conditions,
                'next_steps' => 'Consult a general physician within 24 hours.',
                'color_code' => 'YELLOW'
            ];
        }

        return [
            'triage_level' => 'SELF_CARE',
            'conditions' => $conditions,
            'next_steps' => 'Monitor your symptoms. Rest and hydrate. Consult if they persist.',
            'color_code' => 'GREEN'
        ];
    }

    protected function hasRedFlags(array $symptoms)
    {
        // Hardcoded critical combinations or DB lookup
        $redFlagKeywords = ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'stroke symptoms'];
        
        foreach ($symptoms as $symptom) {
            foreach ($redFlagKeywords as $flag) {
                if (stripos($symptom, $flag) !== false) {
                    return true;
                }
            }
        }
        
        return false;
    }

    protected function calculateConditions(array $symptomNames)
    {
        // Simple scoring algorithm: Match symptom names to conditions in DB
        // For a real production app, this would be a weighted sum
        
        $results = DB::table('condition_symptom')
            ->join('conditions', 'conditions.id', '=', 'condition_symptom.condition_id')
            ->join('symptoms', 'symptoms.id', '=', 'condition_symptom.symptom_id')
            ->whereIn('symptoms.name', $symptomNames)
            ->select('conditions.name', DB::raw('SUM(weight) as score'))
            ->groupBy('conditions.name')
            ->orderByDesc('score')
            ->limit(3)
            ->get();

        $totalScore = $results->sum('score');
        
        return $results->map(function ($row) use ($totalScore) {
            return [
                'name' => $row->name,
                'probability' => $totalScore > 0 ? round($row->score / $totalScore, 2) : 0
            ];
        })->toArray();
    }
}
