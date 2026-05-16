<?php

namespace App\Http\Controllers;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Consultation;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function generate($id)
    {
        $consultation = Consultation::with(['predictions', 'user'])->findOrFail($id);

        $data = [
            'consultation' => $consultation,
            'user' => $consultation->user,
            'symptoms' => $consultation->symptoms_input,
            'triage' => $consultation->triage_result,
            'predictions' => $consultation->predictions,
        ];

        $pdf = Pdf::loadView('reports.triage', $data);
        
        return $pdf->download("ArogyaAI_Report_{$id}.pdf");
    }
}
