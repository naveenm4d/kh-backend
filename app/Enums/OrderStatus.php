<?php

namespace App\Enums;

/**
 * PENDING: waiting for goods to be issued (credit bills start here).
 * ISSUED: goods handed over. COMPLETED: issued and paid. CANCELLED: voided.
 */
enum OrderStatus: string
{
    case Pending = 'PENDING';
    case Issued = 'ISSUED';
    case Completed = 'COMPLETED';
    case Cancelled = 'CANCELLED';
}
