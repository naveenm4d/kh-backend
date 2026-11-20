<?php

namespace App\Actions\Staff;

use App\Enums\Permission;
use App\Models\Role;
use App\Models\User;
use App\Support\Abilities;
use Illuminate\Validation\ValidationException;

final class DeleteRole
{
    public function __invoke(User $actor, Role $role): void
    {
        Abilities::ensure($actor, Permission::PageUsers);

        if ($role->system) {
            throw ValidationException::withMessages(['role' => "{$role->name} is a built-in role and can't be deleted."]);
        }
        $count = $role->users()->count();
        if ($count > 0) {
            throw ValidationException::withMessages([
                'role' => sprintf(
                    '%d staff member%s still %s this role. Move them to another role first.',
                    $count, $count === 1 ? '' : 's', $count === 1 ? 'has' : 'have',
                ),
            ]);
        }
        $role->delete();
    }
}
