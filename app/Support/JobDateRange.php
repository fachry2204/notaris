<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class JobDateRange
{
    public function __construct(public ?Carbon $start, public ?Carbon $end) {}

    public static function fromRequest(Request $request): self
    {
        $data = $request->validate([
            'start_date' => ['nullable', 'required_with:end_date', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'required_with:start_date', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);
        $start = ! empty($data['start_date']) ? Carbon::parse($data['start_date'])->startOfDay() : null;
        $end = ! empty($data['end_date']) ? Carbon::parse($data['end_date'])->endOfDay() : null;
        if ($start && $end && $start->copy()->startOfMonth()->diffInMonths($end->copy()->startOfMonth()) > 23) {
            throw ValidationException::withMessages(['end_date' => 'Rentang tanggal maksimal 24 bulan.']);
        }
        return new self($start, $end);
    }

    public function apply($query, string $column = 'createdAt')
    {
        return $query->when($this->start && $this->end, fn ($query) => $query->whereBetween($column, [$this->start, $this->end]));
    }

    public function months(): array
    {
        $start = $this->start?->copy()->startOfMonth() ?? now()->startOfMonth()->subMonths(5);
        $end = $this->end?->copy()->startOfMonth() ?? now()->startOfMonth();
        return iterator_to_array(CarbonPeriod::create($start, '1 month', $end));
    }

    public function filters(): array
    {
        return ['start_date' => $this->start?->toDateString(), 'end_date' => $this->end?->toDateString()];
    }
}
