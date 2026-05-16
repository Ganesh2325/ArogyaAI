<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'consultation_id',
        'sender',
        'message_text'
    ];

    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }
}
