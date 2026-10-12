<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            // Stable slug for the built-in roles ("admin", "cashier"); null for custom roles.
            $table->string('slug')->nullable()->unique();
            $table->string('name');
            $table->string('description')->default('');
            $table->jsonb('permissions')->default('[]');
            // System roles can't be deleted; a locked role always has every permission.
            $table->boolean('system')->default(false);
            $table->boolean('locked')->default(false);
            $table->timestamps();
        });
        DB::statement('CREATE UNIQUE INDEX roles_name_lower_unique ON roles (lower(name))');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Cashier code printed on bills: lowercase words joined by single hyphens.
            $table->string('code', 24)->unique();
            $table->string('email')->unique();
            $table->string('phone', 32)->default('');
            $table->foreignId('role_id')->constrained()->restrictOnDelete();
            $table->boolean('active')->default(true)->index();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
        DB::statement('CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email))');

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
        Schema::dropIfExists('roles');
    }
};
