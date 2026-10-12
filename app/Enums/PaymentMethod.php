<?php

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash = 'CASH';
    case Card = 'CARD';
    case BankTransfer = 'BANK TRANSFER';
    case Cheque = 'CHEQUE';
    case Credit = 'CREDIT';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::Card => 'Card',
            self::BankTransfer => 'Bank transfer',
            self::Cheque => 'Cheque',
            self::Credit => 'Credit',
        };
    }

    /**
     * Methods that settle money owed. Credit adds to a balance, so it can't pay one off.
     *
     * @return list<self>
     */
    public static function settling(): array
    {
        return [self::Cash, self::Card, self::BankTransfer, self::Cheque];
    }
}
