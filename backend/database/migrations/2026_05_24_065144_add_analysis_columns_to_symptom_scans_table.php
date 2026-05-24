<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('symptom_scans', function (Blueprint $table) {
            $table->string('scan_type')->nullable()->after('image_path');
            $table->text('summary')->nullable()->after('risk_level');
            $table->integer('confidence_score')->nullable()->after('summary');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('symptom_scans', function (Blueprint $table) {
            $table->dropColumn(['scan_type', 'summary', 'confidence_score']);
        });
    }
};
