<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Condition extends Model
{
    protected $fillable = ['name', 'description', 'severity_level', 'specialist_recommendation'];

    public function symptoms()
    {
        return $this->belongsToMany(Symptom::class, 'symptom_condition_map')->withPivot('weight');
    }
}
