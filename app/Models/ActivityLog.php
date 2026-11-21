<?php

namespace App\Models;

use App\Enums\ActivityAction;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One line of the activity log. Written only through App\Support\Activity.
 *
 * @property int $id
 * @property int|null $user_id
 * @property string $actor_name
 * @property int|null $terminal_id
 * @property string|null $terminal_name
 * @property string $ip
 * @property ActivityAction $action
 * @property string|null $subject_type
 * @property int|null $subject_id
 * @property string $subject_label
 * @property string $summary
 * @property list<array{field: string, label: string, from: mixed, to: mixed}>|null $changes
 * @property CarbonImmutable $created_at
 */
#[Fillable(['user_id', 'actor_name', 'terminal_id', 'terminal_name', 'ip', 'action', 'subject_type', 'subject_id', 'subject_label', 'summary', 'changes'])]
class ActivityLog extends Model
{
    public const UPDATED_AT = null;

    /** How long entries are kept. */
    public const RETENTION_DAYS = 90;

    protected function casts(): array
    {
        return [
            'action' => ActivityAction::class,
            'changes' => 'array',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
