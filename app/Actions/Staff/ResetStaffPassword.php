<?php

namespace App\Actions\Staff;

use App\Enums\Permission;
use App\Models\User;
use App\Support\Abilities;

/** Sets a new password for a staff member and signs them out everywhere. */
final class ResetStaffPassword
{
    public function __invoke(User $actor, User $staff, string $password): void
    {
        Abilities::ensure($actor, Permission::PageUsers);

        $staff->forceFill(['password' => $password])->save();
        if (! $staff->is($actor)) {
            SignOutEverywhere::run($staff);
        }
    }
}
