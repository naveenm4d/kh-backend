<?php

namespace App\Models;

use App\Enums\Permission;
use Carbon\CarbonImmutable;
use Database\Factories\RoleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A named set of permissions. System roles can't be deleted; a locked role (Admin) always has
 * every permission in the catalog, including ones added later, whatever its stored list says.
 *
 * @property int $id
 * @property string|null $slug
 * @property string $name
 * @property string $description
 * @property list<string> $permissions
 * @property bool $system
 * @property bool $locked
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['slug', 'name', 'description', 'permissions', 'system', 'locked'])]
class Role extends Model
{
    /** @var array<string, mixed> */
    protected $attributes = ['description' => '', 'permissions' => '[]', 'system' => false, 'locked' => false];

    /** @use HasFactory<RoleFactory> */
    use HasFactory;

    public const ADMIN = 'admin';

    public const CASHIER = 'cashier';

    protected function casts(): array
    {
        return [
            'permissions' => 'array',
            'system' => 'boolean',
            'locked' => 'boolean',
        ];
    }

    /** @return HasMany<User, $this> */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** @return list<string> */
    public function effectivePermissions(): array
    {
        return $this->locked ? Permission::values() : Permission::normalize($this->permissions ?? []);
    }

    public function grants(Permission $permission): bool
    {
        return $this->locked || in_array($permission->value, $this->permissions ?? [], true);
    }

    public function grantsAnyPage(): bool
    {
        return $this->locked || array_intersect(Permission::pageValues(), $this->permissions ?? []) !== [];
    }
}
