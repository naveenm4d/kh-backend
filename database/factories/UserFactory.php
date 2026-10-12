<?php

namespace Database\Factories;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'code' => Str::lower(Str::random(8)),
            'email' => fake()->unique()->safeEmail(),
            'phone' => '',
            'role_id' => fn () => Role::query()->where('slug', Role::CASHIER)->value('id')
                ?? Role::factory()->create()->id,
            'active' => true,
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    public function withRole(Role $role): static
    {
        return $this->state(fn () => ['role_id' => $role->id]);
    }

    /** A staff member on the locked Admin role (every permission). */
    public function admin(): static
    {
        return $this->state(fn () => ['role_id' => Role::query()->where('slug', Role::ADMIN)->value('id')]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['active' => false]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }
}
