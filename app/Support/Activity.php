<?php

namespace App\Support;

use App\Enums\ActivityAction;
use App\Models\ActivityLog;
use App\Models\Terminal;
use App\Models\User;
use BackedEnum;
use Closure;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Lottery;
use Illuminate\Support\Str;

/**
 * Writes the activity log. Actions call record() inside their own transaction, so a change that
 * rolls back leaves no entry. Secrets (passwords, 2FA, key hashes) never reach the log.
 */
final class Activity
{
    /** Never logged, whatever the model says. */
    private const SECRET_FIELDS = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes', 'key_hash', 'token'];

    /** Bookkeeping, not worth showing. */
    private const IGNORED_FIELDS = ['created_at', 'updated_at', 'deleted_at'];

    /**
     * @param  list<array{field: string, label: string, from: mixed, to: mixed}>  $changes
     */
    public static function record(?User $actor, ActivityAction $action, ?Model $subject, string $subjectLabel, string $summary, array $changes = []): ActivityLog
    {
        $request = request();
        $terminal = $request->attributes->get('terminal');
        $terminal = $terminal instanceof Terminal ? $terminal : null;

        $entry = ActivityLog::create([
            'user_id' => $actor?->id,
            'actor_name' => $actor->name ?? '',
            'terminal_id' => $terminal?->id,
            'terminal_name' => $terminal?->name,
            'ip' => (string) $request->ip(),
            'action' => $action,
            'subject_type' => $subject === null ? null : self::subjectType($subject),
            'subject_id' => $subject?->getKey(),
            'subject_label' => Str::limit($subjectLabel, 188),
            'summary' => Str::limit($summary, 252),
            'changes' => $changes === [] ? null : $changes,
        ]);

        Lottery::odds(1, 200)->winner(fn () => DB::afterCommit(fn () => self::prune()))->choose();

        return $entry;
    }

    /**
     * The changed fields of a model about to be saved, as from → to pairs. Call before save().
     * Hidden attributes, secrets and timestamps are left out.
     *
     * @param  array<string, string>  $labels  field => label, when the default ("Display price") won't do
     * @param  array<string, Closure(mixed): mixed>  $formatters  field => value formatter (ids to names)
     * @return list<array{field: string, label: string, from: mixed, to: mixed}>
     */
    public static function changesOf(Model $model, array $labels = [], array $formatters = []): array
    {
        $skip = [...$model->getHidden(), ...self::SECRET_FIELDS, ...self::IGNORED_FIELDS];
        $changes = [];
        foreach (array_keys($model->getDirty()) as $field) {
            if (in_array($field, $skip, true)) {
                continue;
            }
            $format = $formatters[$field] ?? fn (mixed $v): mixed => $v;
            $from = $model->exists ? self::plain($format($model->getOriginal($field))) : null;
            $to = self::plain($format($model->getAttribute($field)));
            if ($from === $to) {
                continue;
            }
            $changes[] = ['field' => $field, 'label' => $labels[$field] ?? self::label($field), 'from' => $from, 'to' => $to];
        }

        return $changes;
    }

    /**
     * One from → to pair, for changes that aren't model attributes.
     *
     * @return array{field: string, label: string, from: mixed, to: mixed}
     */
    public static function change(string $field, string $label, mixed $from, mixed $to): array
    {
        return ['field' => $field, 'label' => $label, 'from' => self::plain($from), 'to' => self::plain($to)];
    }

    /**
     * "Changed Cement 50kg: selling price, stock".
     *
     * @param  list<array{field: string, label: string, from: mixed, to: mixed}>  $changes
     */
    public static function changedSummary(string $name, array $changes): string
    {
        $labels = array_unique(array_map(fn (array $c) => mb_strtolower($c['label']), $changes));

        return 'Changed '.$name.($labels === [] ? '' : ': '.implode(', ', $labels));
    }

    /**
     * Logs a catalog record (brand, category, unit, supplier) being saved. Call before save().
     *
     * @return callable(): void call after save()
     */
    public static function catalogSave(User $user, Model $record, string $kind): callable
    {
        $isNew = ! $record->exists;
        $changes = self::changesOf($record);

        return function () use ($user, $record, $kind, $isNew, $changes): void {
            if ($isNew || $changes !== []) {
                $name = (string) $record->getAttribute('name');
                self::record($user, ActivityAction::CatalogSaved, $record, $name,
                    $isNew ? "Added $kind $name" : self::changedSummary("$kind $name", $changes), $changes);
            }
        };
    }

    /** Deletes entries past the retention period, a chunk at a time. Returns how many went. */
    public static function prune(int $chunk = 1000): int
    {
        $cutoff = now()->subDays(ActivityLog::RETENTION_DAYS);
        $total = 0;
        do {
            $deleted = ActivityLog::query()->where('created_at', '<', $cutoff)->orderBy('id')->limit($chunk)->delete();
            $total += $deleted;
        } while ($deleted === $chunk);

        return $total;
    }

    /** "order", "customer", "shop_setting"… */
    public static function subjectType(Model $model): string
    {
        return Str::snake(class_basename($model));
    }

    private static function label(string $field): string
    {
        return Str::ucfirst(str_replace('_', ' ', Str::endsWith($field, '_id') ? Str::beforeLast($field, '_id') : $field));
    }

    private static function plain(mixed $value): mixed
    {
        return match (true) {
            $value instanceof BackedEnum => $value->value,
            $value instanceof DateTimeInterface => $value->format(DateTimeInterface::ATOM),
            is_scalar($value), is_array($value), $value === null => $value,
            default => (string) json_encode($value),
        };
    }
}
