<?php

namespace App\Actions\Staff;

use App\Enums\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\Abilities;

/** Creates or updates a role. A locked role always keeps every permission. */
final class SaveRole
{
    /** @param  array{name: string, description?: string|null, permissions: array<int, string>}  $data */
    public function __invoke(User $actor, array $data, ?Role $role = null): Role
    {
        Abilities::ensure($actor, Permission::PageUsers);

        $role ??= new Role;
        $role->fill([
            'name' => trim($data['name']),
            'description' => trim((string) ($data['description'] ?? '')),
            'permissions' => $role->locked ? Permission::values() : Permission::normalize($data['permissions']),
        ])->save();

        return $role;
    }
}
