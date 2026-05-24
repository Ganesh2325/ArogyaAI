<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SymptomScan extends Model
{
    protected $fillable = [
        'user_id',
        'image_path',
        'scan_type',
        'summary',
        'confidence_score',
        'ai_analysis',
        'risk_level'
    ];

    protected $casts = [
        'ai_analysis' => 'json'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
