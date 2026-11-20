<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $name
 * @property string $phone
 * @property string $phone_digits
 * @property string $address
 * @property string $credit
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property CarbonImmutable|null $deleted_at
 * @property string|null $spent
 * @property int|null $order_count
 * @property string|null $last_purchase
 */
#[Fillable(['name', 'phone', 'address', 'credit'])]
class Customer extends Model
{
    /** @var array<string, mixed> */
    protected $attributes = ['phone' => '', 'address' => '', 'credit' => '0.00'];

    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'credit' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Customer $customer) {
            $customer->phone_digits = preg_replace('/\D+/', '', $customer->phone) ?? '';
        });
    }

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** @return HasMany<CustomerPayment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(CustomerPayment::class);
    }

    /**
     * Adds lifetime spend, bill count and last purchase date from non-cancelled bills.
     *
     * @param  Builder<Customer>  $query
     */
    public function scopeWithStats(Builder $query): void
    {
        $active = fn () => Order::query()
            ->whereColumn('orders.customer_id', 'customers.id')
            ->where('orders.status', '!=', OrderStatus::Cancelled->value);

        $query->addSelect([
            'spent' => $active()->selectRaw('coalesce(sum(amount), 0)'),
            'order_count' => $active()->selectRaw('count(*)'),
            'last_purchase' => $active()->selectRaw('max(sold_on)'),
        ]);
    }

    /**
     * Matches name or address, or the phone number by its digits.
     *
     * @param  Builder<Customer>  $query
     */
    public function scopeSearch(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);
        if ($term === '') {
            return;
        }
        $like = '%'.addcslashes(mb_strtolower($term), '%_\\').'%';
        $digits = preg_replace('/\D+/', '', $term) ?? '';

        $query->where(function (Builder $q) use ($like, $digits) {
            $q->whereRaw('lower(name) like ?', [$like])
                ->orWhereRaw('lower(address) like ?', [$like]);
            if ($digits !== '') {
                $q->orWhere('phone_digits', 'like', '%'.$digits.'%');
            }
        });
    }
}
