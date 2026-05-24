<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RiskForecast extends Model
{
    protected $fillable = [
        'user_id',
        'health_score',
        'forecast_data'
    ];

    protected $casts = [
        'forecast_data' => 'json'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
