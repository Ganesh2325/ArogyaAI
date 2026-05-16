<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DiagnosisController;
use App\Http\Controllers\ReportController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Auth Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // Diagnosis & Triage
    Route::post('/analyze', [DiagnosisController::class, 'analyze']);
    Route::post('/message', [DiagnosisController::class, 'message']);
    Route::get('/history', [DiagnosisController::class, 'history']);

    // Production-Grade Chat System
    Route::post('/chat/send', [\App\Http\Controllers\ChatController::class, 'sendMessage']);
    Route::get('/chat/history', [\App\Http\Controllers\ChatController::class, 'getHistory']);
    Route::delete('/chat/consultation/{id}', [\App\Http\Controllers\ChatController::class, 'deleteConsultation']);
    
    // Reports
    Route::get('/report/{id}', [ReportController::class, 'generate']);
});

// For testing (Public access to analyze while frontend is being updated)
Route::post('/public/analyze', [DiagnosisController::class, 'analyze']);
