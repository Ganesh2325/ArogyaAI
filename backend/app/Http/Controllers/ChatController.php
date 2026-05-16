<?php

namespace App\Http\Controllers;

use App\Services\ChatService;
use App\Models\Consultation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    protected $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    /**
     * Send a message and get AI response.
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|min:2',
            'consultation_id' => 'nullable|exists:consultations,id'
        ]);

        $userId = Auth::id() ?? 1; // Fallback for dev
        
        $result = $this->chatService->processMessage(
            $request->message,
            $userId,
            $request->consultation_id
        );

        return response()->json($result);
    }

    /**
     * Get chat history (sessions).
     */
    public function getHistory()
    {
        $userId = Auth::id() ?? 1;
        $history = Consultation::where('user_id', $userId)
            ->with(['messages', 'predictions'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($history);
    }

    /**
     * Delete a chat consultation.
     */
    public function deleteConsultation($id)
    {
        $this->chatService->deleteConsultation($id);
        return response()->json(['message' => 'Consultation deleted successfully']);
    }
}
