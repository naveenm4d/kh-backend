<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Money received against a customer's credit balance.
 *
 * @property int $id
 * @property int $customer_id
 * @property int|null $user_id
 * @property string $amount
 * @property PaymentMethod $method
 * @property string $note
 * @property CarbonImmutable $paid_on
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 */
#[Fillable(['customer_id', 'user_id', 'amount', 'method', 'note', 'paid_on'])]
class CustomerPayment extends Model
{
    /** @var array<string, mixed> */
    protected $attributes = ['note' => ''];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'method' => PaymentMethod::class,
            'paid_on' => 'date',
        ];
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
}
