<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * One-off move from the old Postgres install (the `legacy_pgsql` connection) into the MariaDB
 * database this app now runs on. Rebuilds the target schema, copies every business table with its
 * original ids, carries the invoice counter over, then checks counts and money totals match.
 * Afterwards, scripts/export-mariadb-dump.sh turns the result into a dump for phpMyAdmin.
 */
#[Signature('db:copy-from-postgres {--force : Skip the confirmation prompt}')]
#[Description('Copy the old Postgres data into a freshly migrated MariaDB database')]
class CopyFromPostgres extends Command
{
    /** Framework plumbing and throwaway state: rebuilt by migrations or safe to lose. */
    private const SKIP = [
        'migrations', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs',
        'password_reset_tokens',
        // Till sessions; tills sign in again against the new server.
        'personal_access_tokens',
    ];

    /** table => columns whose totals must match on both sides. */
    private const CHECKSUMS = [
        'orders' => ['amount'],
        'order_items' => ['qty', 'total'],
        'products' => ['stock', 'price'],
        'stock_movements' => ['qty_delta'],
        'customers' => ['credit'],
        'customer_payments' => ['amount'],
    ];

    private const CHUNK = 500;

    public function handle(): int
    {
        if (app()->isProduction()) {
            $this->error('Run this on a workstation, not in production.');

            return self::FAILURE;
        }

        $source = DB::connection('legacy_pgsql');
        $target = DB::connection();
        if (! in_array($target->getDriverName(), ['mariadb', 'mysql'], true)) {
            $this->error('The default connection must be MariaDB (DB_CONNECTION=mariadb).');

            return self::FAILURE;
        }

        $this->line(sprintf(
            'From Postgres <info>%s</info> on %s into MariaDB <info>%s</info> on %s.',
            $source->getDatabaseName(), $source->getConfig('host'), $target->getDatabaseName(), $target->getConfig('host'),
        ));
        if (! $this->option('force') && ! $this->confirm('This wipes the MariaDB database and rebuilds it. Continue?')) {
            return self::FAILURE;
        }

        $this->call('migrate:fresh', ['--force' => true]);

        $tables = $this->tablesToCopy($source, $target);

        $target->statement('SET FOREIGN_KEY_CHECKS=0');
        try {
            foreach ($this->targetTables($target) as $table) {
                if ($table !== 'migrations') {
                    $target->table($table)->truncate();
                }
            }
            foreach ($tables as $table => $columns) {
                $copied = $this->copyTable($source, $target, $table, $columns);
                $this->line(sprintf('  %-22s %6d rows', $table, $copied));
            }
        } finally {
            $target->statement('SET FOREIGN_KEY_CHECKS=1');
        }

        $invoice = $this->lastInvoice($source);
        $target->table('counters')->insert(['name' => 'invoice', 'value' => $invoice]);
        $this->line(sprintf('  %-22s INV%06d', 'last invoice', $invoice));

        return $this->verify($source, $target, array_keys($tables)) ? self::SUCCESS : self::FAILURE;
    }

    /**
     * Every source table worth keeping, with the columns to copy. Fails if the two schemas have
     * drifted: a source table or column with nowhere to go would silently lose data.
     *
     * @return array<string, list<string>>
     */
    private function tablesToCopy(Connection $source, Connection $target): array
    {
        $targetTables = $this->targetTables($target);
        $tables = [];
        $problems = [];

        foreach ($source->getSchemaBuilder()->getTables() as $info) {
            $table = (string) $info['name'];
            if (($info['schema'] ?? 'public') !== 'public' || in_array($table, self::SKIP, true)) {
                continue;
            }
            if (! in_array($table, $targetTables, true)) {
                $problems[] = "table {$table} doesn't exist in MariaDB";

                continue;
            }

            $sourceColumns = $source->getSchemaBuilder()->getColumnListing($table);
            $targetColumns = $target->getSchemaBuilder()->getColumnListing($table);
            foreach (array_diff($sourceColumns, $targetColumns) as $missing) {
                $problems[] = "column {$table}.{$missing} doesn't exist in MariaDB";
            }
            $tables[$table] = array_values(array_intersect($sourceColumns, $targetColumns));
        }

        if ($problems !== []) {
            throw new RuntimeException("The schemas don't match:\n  - ".implode("\n  - ", $problems));
        }
        ksort($tables);

        return $tables;
    }

    /** @return list<string> */
    private function targetTables(Connection $target): array
    {
        return array_map(fn (array $t): string => (string) $t['name'], $target->getSchemaBuilder()->getTables());
    }

    /** @param  list<string>  $columns */
    private function copyTable(Connection $source, Connection $target, string $table, array $columns): int
    {
        $orderBy = in_array('id', $columns, true) ? 'id' : $columns[0];
        $copied = 0;
        $batch = [];

        foreach ($source->table($table)->select($columns)->orderBy($orderBy)->lazy(self::CHUNK) as $row) {
            $batch[] = (array) $row;
            if (count($batch) === self::CHUNK) {
                $target->table($table)->insert($batch);
                $copied += count($batch);
                $batch = [];
            }
        }
        if ($batch !== []) {
            $target->table($table)->insert($batch);
            $copied += count($batch);
        }

        return $copied;
    }

    /** The last invoice number Postgres handed out, never below the highest one on a bill. */
    private function lastInvoice(Connection $source): int
    {
        $seq = $source->selectOne('select last_value, is_called from order_invoice_seq');
        $fromSequence = $seq === null ? 0 : (int) $seq->last_value - ($seq->is_called ? 0 : 1);
        $fromBills = (int) $source->scalar("select coalesce(max(substr(invoice, 4)::bigint), 0) from orders where invoice like 'INV%'");

        return max($fromSequence, $fromBills);
    }

    /** @param  list<string>  $tables */
    private function verify(Connection $source, Connection $target, array $tables): bool
    {
        $rows = [];
        $ok = true;

        foreach ($tables as $table) {
            $checks = ['rows' => 'count(*)'];
            foreach (self::CHECKSUMS[$table] ?? [] as $column) {
                $checks["sum({$column})"] = "coalesce(sum({$column}), 0)";
            }
            foreach ($checks as $label => $expr) {
                $decimals = $label === 'rows' ? 0 : 3;
                $from = $this->normalise($source->table($table)->selectRaw("{$expr} as v")->value('v'), $decimals);
                $to = $this->normalise($target->table($table)->selectRaw("{$expr} as v")->value('v'), $decimals);
                $match = $from === $to;
                $ok = $ok && $match;
                $rows[] = [$table, $label, $from, $to, $match ? 'ok' : 'MISMATCH'];
            }
        }

        $this->newLine();
        $this->table(['Table', 'Check', 'Postgres', 'MariaDB', ''], $rows);
        $ok
            ? $this->info('Everything matches. Next: scripts/export-mariadb-dump.sh')
            : $this->error('Some totals differ. Do not ship this database.');

        return $ok;
    }

    private function normalise(mixed $value, int $decimals): string
    {
        return number_format((float) (is_scalar($value) ? $value : 0), $decimals, '.', '');
    }
}
