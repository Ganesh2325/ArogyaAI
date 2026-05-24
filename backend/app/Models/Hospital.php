<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hospital extends Model
{
    protected $fillable = [
        'name',
        'type',
        'latitude',
        'longitude',
        'address',
        'rating',
        'is_open_24_7',
        'phone'
    ];

    public function specialists()
    {
        return $this->hasMany(Specialist::class);
    }

    public function reviews()
    {
        return $this->hasMany(FacilityReview::class);
    }
}
