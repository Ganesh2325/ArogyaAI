<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultationMemory extends Model
{
    protected $table = 'consultation_memory';

    protected $fillable = [
        'user_id',
        'consultation_id',
        'memory_type',
        'memory_fact',
        'relevancy_date'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }
}
