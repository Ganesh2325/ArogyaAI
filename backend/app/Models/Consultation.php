<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    protected $fillable = [
        'user_id',
        'symptoms_input',
        'triage_result',
        'is_completed'
    ];

    protected $casts = [
        'symptoms_input' => 'json',
        'is_completed' => 'boolean'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function predictions()
    {
        return $this->hasMany(Prediction::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }
}
