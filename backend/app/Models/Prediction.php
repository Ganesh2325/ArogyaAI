<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prediction extends Model
{
    protected $fillable = [
        'consultation_id',
        'condition_name',
        'probability'
    ];

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }
}
