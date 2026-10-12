<?php

namespace App\Actions\Customers;

use App\Enums\PaymentMethod;
use App\Enums\Permission;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Money;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Logs money received against a customer's credit and reduces the balance. A payment can't exceed
 * what's owed (allowing half a rupee for rounding), and credit itself isn't a way to pay.
 */
final class RecordPayment
{
    public function __invoke(User $user, Customer $customer, float $amount, PaymentMethod $method, string $note = ''): CustomerPayment
    {
        Abilities::ensure($user, Permission::CustomersPayment);

        if ($amount <= 0) {
            throw ValidationException::withMessages(['amount' => 'Enter an amount greater than zero.']);
        }
        if (! in_array($method, PaymentMethod::settling(), true)) {
            throw ValidationException::withMessages(['method' => 'Choose cash, card, bank transfer or cheque.']);
        }

        return DB::transaction(function () use ($user, $customer, $amount, $method, $note) {
            $customer = Customer::query()->lockForUpdate()->findOrFail($customer->id);
            $owedCents = Money::toCents($customer->credit);
            $amountCents = Money::toCents($amount);

            if ($owedCents <= 0) {
                throw ValidationException::withMessages(['amount' => "This customer doesn't owe anything."]);
            }
            if ($amountCents > $owedCents + 50) {
                throw ValidationException::withMessages(['amount' => sprintf("That's more than the %s owed.", Money::format($customer->credit))]);
            }
            $amountCents = min($amountCents, $owedCents);

            $payment = CustomerPayment::create([
                'customer_id' => $customer->id,
                'user_id' => $user->id,
                'amount' => Money::fromCents($amountCents),
                'method' => $method,
                'note' => trim($note),
                'paid_on' => now()->toDateString(),
            ]);

            $customer->credit = Money::fromCents($owedCents - $amountCents);
            $customer->save();

            return $payment;
        });
    }
}
