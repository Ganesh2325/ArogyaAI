<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\SymptomScannerController;

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
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index']);
    
    // Symptom Scanner Endpoints
    Route::post('/scanner/analyze', [SymptomScannerController::class, 'analyze']);
    Route::get('/scanner/history', [SymptomScannerController::class, 'history']);
    Route::delete('/scanner/{id}', [SymptomScannerController::class, 'destroy']);
    
    // Health Analytics Endpoints
    Route::get('/analytics/metrics', [\App\Http\Controllers\HealthAnalyticsController::class, 'metrics']);
    

    // Risk Prediction Endpoints
    Route::get('/risk-prediction', [\App\Http\Controllers\RiskPredictionController::class, 'forecast']);
    
    // Consultation Endpoints
    Route::post('/consultation/start', [ConsultationController::class, 'start']);
    Route::post('/consultation/message', [ConsultationController::class, 'message']);
    Route::get('/consultation/history', [ConsultationController::class, 'history']);
    Route::get('/consultation/memory', [ConsultationController::class, 'memory']);
    Route::delete('/consultation/{id}', [ConsultationController::class, 'destroy']);
});
