<?php

use App\Models\ActivityLog;
use App\Support\Activity;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('activity:prune', function () {
    $this->info(sprintf('Deleted %d activity log entries older than %d days.', Activity::prune(), ActivityLog::RETENTION_DAYS));
})->purpose('Delete activity log entries past the retention period');
