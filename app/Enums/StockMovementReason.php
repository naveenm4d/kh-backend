<?php

namespace App\Enums;

enum StockMovementReason: string
{
    case Sale = 'sale';
    case Cancel = 'cancel';
    case Edit = 'edit';
    case Adjust = 'adjust';
    case Receive = 'receive';
    case Opening = 'opening';
}
