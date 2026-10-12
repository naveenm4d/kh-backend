<?php

namespace App\Enums;

/**
 * One thing a role may do. Pages gate the admin console; the rest gate actions and are checked
 * on every request, so hiding a button is never the only protection. Case order is the catalog's
 * display order (the roles editor shows them this way and stored lists are kept in it).
 */
enum Permission: string
{
    case PageDashboard = 'page.dashboard';
    case PageReports = 'page.reports';
    case PageCustomers = 'page.customers';
    case PageOrders = 'page.orders';
    case PageInventory = 'page.inventory';
    case PageCatalog = 'page.catalog';
    case PageUsers = 'page.users';
    case PageSettings = 'page.settings';

    case PosAccess = 'pos.access';
    case PosDiscount = 'pos.discount';
    case PosCredit = 'pos.credit';

    case OrdersEdit = 'orders.edit';
    case OrdersCancel = 'orders.cancel';

    case CustomersPayment = 'customers.payment';
    case StockAdjust = 'stock.adjust';
    case PricesEdit = 'prices.edit';
    case RecordsDelete = 'records.delete';

    public function group(): string
    {
        return match (true) {
            str_starts_with($this->value, 'page.') => 'Admin pages',
            str_starts_with($this->value, 'pos.') => 'Cashier',
            str_starts_with($this->value, 'orders.') => 'Bills',
            default => 'Money & stock',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::PageDashboard => 'Dashboard',
            self::PageReports => 'Reports',
            self::PageCustomers => 'Customers',
            self::PageOrders => 'Orders',
            self::PageInventory => 'Inventory',
            self::PageCatalog => 'Catalog',
            self::PageUsers => 'Users & roles',
            self::PageSettings => 'Settings',
            self::PosAccess => 'Use the cashier screen',
            self::PosDiscount => 'Give discounts',
            self::PosCredit => 'Sell on credit',
            self::OrdersEdit => 'Edit bill items',
            self::OrdersCancel => 'Cancel bills',
            self::CustomersPayment => 'Record customer payments',
            self::StockAdjust => 'Change stock',
            self::PricesEdit => 'Change prices',
            self::RecordsDelete => 'Delete records',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::PageDashboard => "Today's sales, credit to collect and stock running low.",
            self::PageReports => 'Compare sales across any two periods.',
            self::PageCustomers => 'Customer list, balances and history.',
            self::PageOrders => 'Find, print and issue bills.',
            self::PageInventory => 'Products and stock levels.',
            self::PageCatalog => 'Brands, categories and suppliers.',
            self::PageUsers => 'Staff accounts, passwords and these permissions.',
            self::PageSettings => 'Shop details, stock levels and cashier tills.',
            self::PosAccess => 'Ring up sales and print receipts.',
            self::PosDiscount => 'Sell below the selling price. Marked-price discounts work without this.',
            self::PosCredit => "Add a bill to a customer's balance.",
            self::OrdersEdit => "Change the items on a bill after it's rung up.",
            self::OrdersCancel => 'Cancel a bill, returning stock and reversing credit.',
            self::CustomersPayment => 'Take payments against credit, or change a balance by hand.',
            self::StockAdjust => 'Add received stock, or correct a count in the product details.',
            self::PricesEdit => 'Edit selling and marked prices.',
            self::RecordsDelete => 'Delete customers, products, brands, categories and suppliers.',
        };
    }

    public function isPage(): bool
    {
        return str_starts_with($this->value, 'page.');
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $p) => $p->value, self::cases());
    }

    /** @return list<string> */
    public static function pageValues(): array
    {
        return array_values(array_map(
            fn (self $p) => $p->value,
            array_filter(self::cases(), fn (self $p) => $p->isPage()),
        ));
    }

    /**
     * Validates, de-duplicates and orders a permission list the way the catalog lists them.
     *
     * @param  array<int, string>  $values
     * @return list<string>
     */
    public static function normalize(array $values): array
    {
        $wanted = array_flip($values);

        return array_values(array_filter(self::values(), fn (string $v) => isset($wanted[$v])));
    }

    /** @return list<array{key: string, group: string, label: string, description: string}> */
    public static function catalog(): array
    {
        return array_map(fn (self $p) => [
            'key' => $p->value,
            'group' => $p->group(),
            'label' => $p->label(),
            'description' => $p->description(),
        ], self::cases());
    }
}
