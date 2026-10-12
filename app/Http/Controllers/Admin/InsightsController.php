<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Queries\DashboardSummary;
use App\Queries\ReportSummary;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Dashboard and reports figures. */
class InsightsController extends Controller
{
    public function dashboard(DashboardSummary $summary): JsonResponse
    {
        return response()->json($summary());
    }

    public function report(Request $request, ReportSummary $summary): JsonResponse
    {
        $data = $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
            'granularity' => ['nullable', 'in:day,month'],
        ], ['to.after_or_equal' => 'The end date is before the start date.']);

        $from = CarbonImmutable::parse($data['from']);
        $to = CarbonImmutable::parse($data['to']);
        abort_if($from->diffInDays($to) > 3660, 422, 'Choose a range of ten years or less.');

        return response()->json($summary($from, $to, $data['granularity'] ?? 'day'));
    }
}
