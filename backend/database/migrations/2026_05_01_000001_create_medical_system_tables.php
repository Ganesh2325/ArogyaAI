<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Symptoms Reference Table
        Schema::create('symptoms', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('category')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_red_flag')->default(false);
            $table->timestamps();
        });

        // Conditions Reference Table
        Schema::create('conditions', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->string('severity_level')->nullable(); // EMERGENCY, PRIMARY_CARE, SELF_CARE
            $table->string('specialist_recommendation')->nullable();
            $table->timestamps();
        });

        // Mapping Table (Many-to-Many between Symptoms and Conditions)
        Schema::create('symptom_condition_map', function (Blueprint $table) {
            $table->id();
            $table->foreignId('condition_id')->constrained()->onDelete('cascade');
            $table->foreignId('symptom_id')->constrained()->onDelete('cascade');
            $table->float('weight')->default(1.0);
            $table->timestamps();
        });

        // Consultations (Main Chat Session)
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->json('symptoms_input')->nullable(); // JSON field for extracted symptoms
            $table->string('triage_result')->nullable(); // EMERGENCY, PRIMARY_CARE, SELF_CARE
            $table->boolean('is_completed')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('consultations');
        Schema::dropIfExists('symptom_condition_map');
        Schema::dropIfExists('conditions');
        Schema::dropIfExists('symptoms');
    }
};
