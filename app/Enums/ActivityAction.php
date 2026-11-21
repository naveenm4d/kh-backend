<?php

namespace App\Enums;

/** What an activity log entry records. The prefix before the dot is its group (the page's filter). */
enum ActivityAction: string
{
    case OrderItemsUpdated = 'order.items_updated';
    case OrderIssued = 'order.issued';
    case OrderSettled = 'order.settled';
    case OrderCancelled = 'order.cancelled';

    case CustomerCreated = 'customer.created';
    case CustomerUpdated = 'customer.updated';
    case CustomerDeleted = 'customer.deleted';
    case CustomerPayment = 'customer.payment';

    case ProductCreated = 'product.created';
    case ProductUpdated = 'product.updated';
    case ProductDeleted = 'product.deleted';
    case StockReceived = 'stock.received';

    case CatalogSaved = 'catalog.saved';
    case CatalogDeleted = 'catalog.deleted';

    case StaffCreated = 'staff.created';
    case StaffUpdated = 'staff.updated';
    case StaffDeleted = 'staff.deleted';
    case StaffPasswordReset = 'staff.password_reset';
    case RoleSaved = 'role.saved';
    case RoleDeleted = 'role.deleted';

    case SettingsUpdated = 'settings.updated';
    case TerminalRegistered = 'terminal.registered';
    case TerminalRevoked = 'terminal.revoked';

    case SignedIn = 'auth.signed_in';
    case SignInFailed = 'auth.sign_in_failed';
    case SignedOut = 'auth.signed_out';

    /** Filter groups, in display order: key => label. */
    public const GROUPS = [
        'bills' => 'Bills',
        'customers' => 'Customers',
        'stock' => 'Stock & prices',
        'catalog' => 'Catalog',
        'staff' => 'Staff & roles',
        'settings' => 'Settings & tills',
        'signin' => 'Sign-in',
    ];

    public function group(): string
    {
        return match (strstr($this->value, '.', true)) {
            'order' => 'bills',
            'customer' => 'customers',
            'product', 'stock' => 'stock',
            'catalog' => 'catalog',
            'staff', 'role' => 'staff',
            'settings', 'terminal' => 'settings',
            default => 'signin',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::OrderItemsUpdated => 'Bill edited',
            self::OrderIssued => 'Bill collected',
            self::OrderSettled => 'Bill paid',
            self::OrderCancelled => 'Bill cancelled',
            self::CustomerCreated => 'Customer added',
            self::CustomerUpdated => 'Customer changed',
            self::CustomerDeleted => 'Customer deleted',
            self::CustomerPayment => 'Payment recorded',
            self::ProductCreated => 'Product added',
            self::ProductUpdated => 'Product changed',
            self::ProductDeleted => 'Product deleted',
            self::StockReceived => 'Stock received',
            self::CatalogSaved => 'Catalog changed',
            self::CatalogDeleted => 'Catalog record deleted',
            self::StaffCreated => 'Staff added',
            self::StaffUpdated => 'Staff changed',
            self::StaffDeleted => 'Staff deleted',
            self::StaffPasswordReset => 'Password reset',
            self::RoleSaved => 'Role saved',
            self::RoleDeleted => 'Role deleted',
            self::SettingsUpdated => 'Settings changed',
            self::TerminalRegistered => 'Till registered',
            self::TerminalRevoked => 'Till removed',
            self::SignedIn => 'Signed in',
            self::SignInFailed => 'Sign-in failed',
            self::SignedOut => 'Signed out',
        };
    }

    /** @return list<string> */
    public static function valuesInGroup(string $group): array
    {
        return array_values(array_map(
            fn (self $a) => $a->value,
            array_filter(self::cases(), fn (self $a) => $a->group() === $group),
        ));
    }
}
