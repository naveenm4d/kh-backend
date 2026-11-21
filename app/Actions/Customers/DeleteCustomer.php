<?php

namespace App\Actions\Customers;

use App\Enums\ActivityAction;
use App\Enums\Permission;
use App\Models\Customer;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Activity;
use Illuminate\Validation\ValidationException;

/** Soft-deletes a customer; their bills and payments keep pointing at the archived record. */
final class DeleteCustomer
{
    public function __invoke(User $user, Customer $customer): void
    {
        Abilities::ensure($user, Permission::PageCustomers, Permission::RecordsDelete);

        if ((float) $customer->credit > 0) {
            throw ValidationException::withMessages([
                'customer' => "{$customer->name} still owes money. Record their payment or clear the balance first.",
            ]);
        }

        $customer->delete();
        Activity::record($user, ActivityAction::CustomerDeleted, $customer, $customer->name, 'Deleted customer '.$customer->name);
    }
}
