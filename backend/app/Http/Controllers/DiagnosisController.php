<?php

namespace App\Http\Controllers;

use App\Services\DiagnosisService;
use App\Models\Consultation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DiagnosisController extends Controller
{
    protected $diagnosisService;

    public function __construct(DiagnosisService $diagnosisService)
    {
        $this->diagnosisService = $diagnosisService;
    }

    /**
     * Analyze user symptoms and return triage result.
     */
    public function analyze(Request $request)
    {
        $request->validate([
            'input' => 'required|string|min:5'
        ]);

        $userId = Auth::id() ?? 1; 

        $result = $this->diagnosisService->analyze($request->input, $userId);

        return response()->json($result);
    }

    /**
     * Save a chat message.
     */
    public function message(Request $request)
    {
        $request->validate([
            'consultation_id' => 'required|exists:consultations,id',
            'sender' => 'required|in:user,ai',
            'message_text' => 'required|string'
        ]);

        $message = Message::create($request->all());

        return response()->json($message, 201);
    }

    /**
     * Get consultation history for the user.
     */
    public function history()
    {
        $userId = Auth::id() ?? 1;
        $history = Consultation::where('user_id', $userId)
            ->with(['predictions', 'messages'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($history);
    }
}
