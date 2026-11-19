<?php

namespace App\Actions\Orders;

use App\Enums\ItemSource;
use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\Permission;
use App\Enums\StockMovementReason;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Terminal;
use App\Models\User;
use App\Support\Abilities;
use App\Support\Money;
use App\Support\Stock;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Rings up a sale: prices the lines, takes the stock, and for credit sales adds the bill to the
 * customer's balance, all in one transaction. Replaying the same client reference returns the
 * bill created the first time, so a retried checkout can't sell twice.
 */
final class CreateOrder
{
    public function __construct(private readonly PriceLines $priceLines) {}

    /**
     * @param  list<array{productId: int, qty: int|float, unitPrice: float, discountPct: float, source: ItemSource}>  $lines
     */
    public function __invoke(
        User $cashier,
        array $lines,
        PaymentMethod $payment,
        ?int $customerId = null,
        ?float $cashReceived = null,
        ?string $clientRef = null,
        ?Terminal $terminal = null,
    ): Order {
        Abilities::ensure($cashier, Permission::PosAccess);
        if ($payment === PaymentMethod::Credit) {
            Abilities::ensure($cashier, Permission::PosCredit);
            if ($customerId === null) {
                throw ValidationException::withMessages(['customerId' => 'Choose the customer this credit bill belongs to.']);
            }
        }

        if ($clientRef !== null && ($existing = $this->findReplay($clientRef, $terminal)) !== null) {
            return $existing;
        }

        try {
            return DB::transaction(function () use ($cashier, $lines, $payment, $customerId, $cashReceived, $clientRef, $terminal) {
                $customer = $customerId === null ? null : Customer::query()->lockForUpdate()->find($customerId);
                if ($customerId !== null && $customer === null) {
                    throw ValidationException::withMessages(['customerId' => 'That customer no longer exists.']);
                }

                $products = PriceLines::lockProducts(array_column($lines, 'productId'));
                $priced = ($this->priceLines)($cashier, $lines, $products);
                $amount = Money::fromCents($priced['amountCents']);

                if ($payment === PaymentMethod::Cash && $cashReceived !== null && Money::toCents($cashReceived) < $priced['amountCents']) {
                    throw ValidationException::withMessages(['cashReceived' => 'The cash received is less than the bill total.']);
                }

                $order = Order::create([
                    'invoice' => Order::nextInvoice(),
                    'client_ref' => $clientRef,
                    'customer_id' => $customer?->id,
                    'customer_name' => $customer->name ?? 'Walk-in',
                    'user_id' => $cashier->id,
                    'cashier_name' => $cashier->name,
                    'cashier_code' => $cashier->code,
                    'terminal_id' => $terminal?->id,
                    'payment' => $payment,
                    'status' => $payment === PaymentMethod::Credit ? OrderStatus::Pending : OrderStatus::Completed,
                    'amount' => $amount,
                    'cash_received' => $payment === PaymentMethod::Cash && $cashReceived !== null ? Money::fromCents(Money::toCents($cashReceived)) : null,
                    'sold_on' => now()->toDateString(),
                ]);
                $order->items()->createMany($priced['lines']);

                foreach ($priced['qtyByProduct'] as $productId => $qty) {
                    Stock::move($products[$productId], -$qty, StockMovementReason::Sale, $cashier, $order);
                }

                if ($customer !== null) {
                    if ($payment === PaymentMethod::Credit) {
                        $customer->credit = Money::fromCents(Money::toCents($customer->credit) + $priced['amountCents']);
                    }
                    // Spend and bill count changed either way; touching tells the tills to re-sync.
                    $customer->updated_at = now();
                    $customer->save();
                }

                return $order->load('items');
            });
        } catch (UniqueConstraintViolationException $e) {
            // Two identical retries raced; the other one won. Hand back its bill.
            if ($clientRef !== null && ($existing = $this->findReplay($clientRef, $terminal)) !== null) {
                return $existing;
            }
            throw $e;
        }
    }

    private function findReplay(string $clientRef, ?Terminal $terminal): ?Order
    {
        return Order::query()
            ->where('client_ref', $clientRef)
            ->where('terminal_id', $terminal?->id)
            ->with('items')
            ->first();
    }
}
