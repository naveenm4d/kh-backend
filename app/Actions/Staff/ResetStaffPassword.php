<?php

namespace App\Actions\Staff;

use App\Enums\ActivityAction;
use App\Enums\Permission;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Activity;
use Illuminate\Support\Facades\DB;

/** Sets a new password for a staff member and signs them out everywhere. */
final class ResetStaffPassword
{
    public function __invoke(User $actor, User $staff, string $password): void
    {
        Abilities::ensure($actor, Permission::PageUsers);

        DB::transaction(function () use ($actor, $staff, $password) {
            $staff->forceFill(['password' => $password])->save();
            if (! $staff->is($actor)) {
                SignOutEverywhere::run($staff);
            }
            Activity::record($actor, ActivityAction::StaffPasswordReset, $staff, $staff->name,
                $staff->is($actor) ? 'Reset their own password' : "Reset the password for {$staff->name}");
        });
    }
}
