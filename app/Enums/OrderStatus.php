<?php

namespace App\Enums;

/**
 * READY_TO_COLLECT: has warehouse lines still to be handed over (any payment).
 * PAYMENT_PENDING: credit bill with all goods handed over, waiting to be marked as paid.
 * COMPLETED: goods handed over and paid. CANCELLED: voided.
 */
enum OrderStatus: string
{
    case ReadyToCollect = 'READY_TO_COLLECT';
    case PaymentPending = 'PAYMENT_PENDING';
    case Completed = 'COMPLETED';
    case Cancelled = 'CANCELLED';

    /** Where a new bill starts: waiting at the warehouse, or straight to its post-collection status. */
    public static function initial(PaymentMethod $payment, bool $hasWarehouseItems): self
    {
        return $hasWarehouseItems ? self::ReadyToCollect : self::afterCollection($payment);
    }

    /** Where a bill goes once its goods are handed over: credit waits for payment, the rest are done. */
    public static function afterCollection(PaymentMethod $payment): self
    {
        return $payment === PaymentMethod::Credit ? self::PaymentPending : self::Completed;
    }
}
