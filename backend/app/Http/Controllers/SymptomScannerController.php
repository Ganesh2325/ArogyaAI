<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SymptomScan;
use App\Services\AIAssistantService;
use Illuminate\Support\Facades\Storage;

class SymptomScannerController extends Controller
{
    protected $aiService;

    public function __construct(AIAssistantService $aiService)
    {
        $this->aiService = $aiService;
    }

    public function analyze(Request $request)
    {
        $request->validate([
            'image' => 'required|mimes:jpeg,png,jpg,pdf|max:10240' // max 10MB
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $file = $request->file('image');
        
        // Save to local storage for history
        $path = $file->store('scans', 'public');

        // Convert file to base64 for Gemini
        $fileBase64 = base64_encode(file_get_contents($file->getRealPath()));
        $mimeType = $file->getMimeType();

        // Call Gemini (which now handles both PDFs and Images)
        $analysisResult = $this->aiService->analyzeMedicalDocument($fileBase64, $mimeType);

        if (isset($analysisResult['error'])) {
            return response()->json(['error' => $analysisResult['error']], 500);
        }

        // Save to DB
        $scan = SymptomScan::create([
            'user_id' => $user->id,
            'image_path' => $path,
            'scan_type' => $analysisResult['scan_type'] ?? 'IMAGE_SCAN',
            'summary' => $analysisResult['summary'] ?? null,
            'confidence_score' => $analysisResult['confidence_score'] ?? null,
            'risk_level' => $analysisResult['risk_level'] ?? 'UNKNOWN',
            'ai_analysis' => $analysisResult['analysis'] ?? []
        ]);

        $scan->image_url = asset('storage/' . $scan->image_path);
        
        // Return structured result for frontend parsing
        return response()->json([
            'scan' => $scan
        ]);
    }

    public function history(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $scans = SymptomScan::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($scan) {
                // If it's a PDF, we might not want to return the raw URL for image tag, but we provide it anyway
                $scan->image_url = asset('storage/' . $scan->image_path);
                $scan->is_pdf = pathinfo($scan->image_path, PATHINFO_EXTENSION) === 'pdf';
                return $scan;
            });

        return response()->json([
            'scans' => $scans
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $scan = SymptomScan::where('id', $id)->where('user_id', $user->id)->first();
        if (!$scan) {
            return response()->json(['error' => 'Not found'], 404);
        }

        if (Storage::disk('public')->exists($scan->image_path)) {
            Storage::disk('public')->delete($scan->image_path);
        }
        
        $scan->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}
