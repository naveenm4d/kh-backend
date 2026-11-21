<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Who changed what, and when (the Activity log page). Names are snapshots so an entry still reads
 * right after the person, till or record is gone. Entries older than 90 days are pruned.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('actor_name')->default('');
            $table->foreignId('terminal_id')->nullable()->constrained()->nullOnDelete();
            $table->string('terminal_name')->nullable();
            $table->string('ip', 45)->default('');
            $table->string('action', 64);
            $table->string('subject_type', 32)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_label', 191)->default('');
            $table->string('summary')->default('');
            $table->json('changes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('created_at');
            $table->index(['user_id', 'created_at']);
            $table->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
