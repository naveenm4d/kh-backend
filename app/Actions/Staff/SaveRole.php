<?php

namespace App\Actions\Staff;

use App\Enums\ActivityAction;
use App\Enums\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Activity;
use Illuminate\Support\Facades\DB;

/** Creates or updates a role. A locked role always keeps every permission. */
final class SaveRole
{
    /** @param  array{name: string, description?: string|null, permissions: array<int, string>}  $data */
    public function __invoke(User $actor, array $data, ?Role $role = null): Role
    {
        Abilities::ensure($actor, Permission::PageUsers);

        $role ??= new Role;
        $isNew = ! $role->exists;
        $before = $isNew ? [] : $role->effectivePermissions();
        $role->fill([
            'name' => trim($data['name']),
            'description' => trim((string) ($data['description'] ?? '')),
            'permissions' => $role->locked ? Permission::values() : Permission::normalize($data['permissions']),
        ]);
        $changes = array_values(array_filter(Activity::changesOf($role), fn (array $c) => $c['field'] !== 'permissions'));
        $label = fn (array $keys) => implode(', ', array_map(fn (string $k) => Permission::from($k)->label(), $keys));
        $added = array_values(array_diff($role->effectivePermissions(), $before));
        $removed = array_values(array_diff($before, $role->effectivePermissions()));
        if ($added !== []) {
            $changes[] = Activity::change('permissions_added', 'Permissions added', null, $label($added));
        }
        if ($removed !== []) {
            $changes[] = Activity::change('permissions_removed', 'Permissions removed', $label($removed), null);
        }

        return DB::transaction(function () use ($actor, $role, $isNew, $changes) {
            $role->save();
            if ($isNew || $changes !== []) {
                Activity::record($actor, ActivityAction::RoleSaved, $role, $role->name,
                    $isNew ? "Added role {$role->name}" : Activity::changedSummary("role {$role->name}", $changes), $changes);
            }

            return $role;
        });
    }
}
