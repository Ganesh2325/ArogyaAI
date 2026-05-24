<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultationMessage extends Model
{
    protected $fillable = [
        'consultation_id',
        'role',
        'message',
        'extracted_symptoms',
        'follow_up_questions',
        'triage_level'
    ];

    protected $casts = [
        'extracted_symptoms' => 'json'
    ];

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }
}
