<?php

namespace App\Actions\Customers;

use App\Enums\Permission;
use App\Models\Customer;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Money;

/**
 * Creates or updates a customer. Cashiers can add customers from the till; setting or changing a
 * balance by hand is money handling and needs the payments permission.
 */
final class SaveCustomer
{
    /** @param  array{name: string, phone?: string|null, address?: string|null, credit?: float|int|string|null}  $data */
    public function __invoke(User $user, array $data, ?Customer $customer = null): Customer
    {
        Abilities::ensureAny($user, Permission::PosAccess, Permission::PageCustomers);

        $creditCents = array_key_exists('credit', $data) && $data['credit'] !== null
            ? Money::toCents($data['credit'])
            : ($customer === null ? 0 : Money::toCents($customer->credit));
        $currentCents = $customer === null ? 0 : Money::toCents($customer->credit);
        if ($creditCents !== $currentCents) {
            Abilities::ensure($user, Permission::CustomersPayment);
        }

        $customer ??= new Customer;
        $customer->fill([
            'name' => trim($data['name']),
            'phone' => trim((string) ($data['phone'] ?? '')),
            'address' => trim((string) ($data['address'] ?? '')),
            'credit' => Money::fromCents($creditCents),
        ])->save();

        return $customer;
    }
}
