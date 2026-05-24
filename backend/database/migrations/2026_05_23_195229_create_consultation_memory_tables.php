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
        Schema::create('consultation_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->enum('role', ['user', 'assistant', 'system']);
            $table->text('message');
            $table->json('extracted_symptoms')->nullable();
            $table->text('follow_up_questions')->nullable();
            $table->string('triage_level')->nullable();
            $table->timestamps();
        });

        Schema::create('consultation_memory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->string('memory_type'); // symptom, recommendation, risk, behavioral
            $table->text('memory_fact'); // e.g. "User experiences recurring migraines since 3 months"
            $table->date('relevancy_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultation_memory');
        Schema::dropIfExists('consultation_messages');
    }
};
