<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    protected $fillable = [
        'user_id',
        'family_profile_id',
        'title',
        'risk_category',
        'summary',
        'recommended_action'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(ConsultationMessage::class);
    }

    public function memory()
    {
        return $this->hasMany(ConsultationMemory::class);
    }

    public function summaries()
    {
        return $this->hasMany(ConsultationSummary::class);
    }
}
