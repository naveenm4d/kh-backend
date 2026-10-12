<?php

namespace App\Enums;

/** Where a line is collected from. Warehouse lines print on the receipt's tear-off slip. */
enum ItemSource: string
{
    case Store = 'STORE';
    case Warehouse = 'WAREHOUSE';
}
