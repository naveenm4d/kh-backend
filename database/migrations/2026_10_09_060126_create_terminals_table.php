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
        // A registered cashier till. Only requests carrying a live terminal key reach the POS API,
        // so a leaked cashier password alone can't be used from an arbitrary machine.
        Schema::create('terminals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // sha256 of the key; the plain key is shown once when the terminal is registered.
            $table->char('key_hash', 64)->unique();
            // First characters of the key, so admins can tell keys apart without seeing them.
            $table->string('key_hint', 12);
            $table->timestamp('last_seen_at')->nullable();
            $table->string('last_ip', 45)->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('terminals');
    }
};
