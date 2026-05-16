<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Symptom extends Model
{
    protected $fillable = ['name', 'category', 'description', 'is_red_flag'];

    public function conditions()
    {
        return $this->belongsToMany(Condition::class, 'symptom_condition_map')->withPivot('weight');
    }
}
