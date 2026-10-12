<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

/**
 * A bill. Customer and cashier names are snapshots, so later renames don't rewrite history.
 *
 * @property int $id
 * @property string $invoice
 * @property string|null $client_ref
 * @property int|null $customer_id
 * @property string $customer_name
 * @property int|null $user_id
 * @property string $cashier_name
 * @property string $cashier_code
 * @property int|null $terminal_id
 * @property PaymentMethod $payment
 * @property OrderStatus $status
 * @property string $amount
 * @property string|null $cash_received
 * @property CarbonImmutable $sold_on
 * @property CarbonImmutable|null $cancelled_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Collection<int, OrderItem> $items
 * @property-read Customer|null $customer
 */
#[Fillable([
    'invoice', 'client_ref', 'customer_id', 'customer_name', 'user_id', 'cashier_name', 'cashier_code',
    'terminal_id', 'payment', 'status', 'amount', 'cash_received', 'sold_on', 'cancelled_at',
])]
class Order extends Model
{
    /** @var array<string, mixed> */
    protected $attributes = ['cashier_code' => ''];

    protected function casts(): array
    {
        return [
            'payment' => PaymentMethod::class,
            'status' => OrderStatus::class,
            'amount' => 'decimal:2',
            'cash_received' => 'decimal:2',
            'sold_on' => 'date',
            'cancelled_at' => 'datetime',
        ];
    }

    /** Next invoice number from a Postgres sequence: gap-tolerant and safe under concurrency. */
    public static function nextInvoice(): string
    {
        $next = (int) DB::scalar("select nextval('order_invoice_seq')");

        return sprintf('INV%06d', $next);
    }

    public function getRouteKeyName(): string
    {
        return 'invoice';
    }

    /** @return HasMany<OrderItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class)->orderBy('id');
    }

    /** @return BelongsTo<Customer, $this> */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class)->withTrashed();
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Terminal, $this> */
    public function terminal(): BelongsTo
    {
        return $this->belongsTo(Terminal::class);
    }

    /** @param  Builder<Order>  $query */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', '!=', OrderStatus::Cancelled->value);
    }

    /** @param  Builder<Order>  $query */
    public function scopeNewestFirst(Builder $query): void
    {
        $query->orderByDesc('sold_on')->orderByDesc('invoice');
    }

    /**
     * Invoice number or customer name contains the term.
     *
     * @param  Builder<Order>  $query
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);
        if ($term === '') {
            return;
        }
        $like = '%'.addcslashes(mb_strtolower($term), '%_\\').'%';
        $query->where(fn (Builder $q) => $q
            ->whereRaw('lower(invoice) like ?', [$like])
            ->orWhereRaw('lower(customer_name) like ?', [$like]));
    }
}
