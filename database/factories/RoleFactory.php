<?php

namespace Database\Factories;

use App\Enums\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    protected $model = Role::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->jobTitle(),
            'description' => '',
            'permissions' => [],
            'system' => false,
            'locked' => false,
        ];
    }

    /** @param  list<Permission>  $permissions */
    public function granting(array $permissions): static
    {
        return $this->state(fn () => ['permissions' => array_map(fn ($p) => $p->value, $permissions)]);
    }
}
