<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DocumentEditHistory
{
    public function activity(Request $request, string $type, string $id, string $description, array $details = []): void
    {
        $actor = $request->session()->get('auth_user', []);
        DB::table('document_edit_history')->insert([
            'document_type' => $type, 'document_id' => $id,
            'actor_id' => $actor['id'] ?? null,
            'actor_name' => $actor['fullName'] ?? $actor['username'] ?? 'Pengguna tidak diketahui',
            'reason' => $description,
            'changes' => json_encode($details, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), 'created_at' => now(),
        ]);
    }
    public function record(Request $request, string $type, string $id, object $before, array $after, $oldItems, array $newItems, string $reason): void
    {
        $changes = [];
        foreach ($after as $field => $value) {
            $old = $before->{$field} ?? null;
            $numeric = in_array($field, ['amount', 'subtotal', 'discount', 'taxPercent', 'taxAmount', 'grandTotal'], true);
            $date = in_array($field, ['date', 'dueDate', 'quotationDate', 'validUntil'], true);
            $oldComparable = $date && $old ? substr((string) $old, 0, 10) : (string) ($old ?? '');
            $newComparable = $date && $value ? substr((string) $value, 0, 10) : (string) ($value ?? '');
            if ($numeric ? (float) $old !== (float) $value : $oldComparable !== $newComparable) {
                $changes[] = ['field' => $field, 'before' => $old, 'after' => $value];
            }
        }
        $normalize = fn ($items) => collect($items)->map(fn ($item) => [
            'description' => (string) data_get($item, 'description'),
            'quantity' => (float) data_get($item, 'quantity'),
            'unit' => (string) data_get($item, 'unit'),
            'unitPrice' => (float) data_get($item, 'unitPrice'),
        ])->values()->all();
        $oldList = $normalize($oldItems);
        $newList = $normalize($newItems);
        if ($oldList !== $newList) {
            $changes[] = ['field' => 'items', 'before' => $oldList, 'after' => $newList];
        }
        $actor = $request->session()->get('auth_user', []);
        DB::table('document_edit_history')->insert([
            'document_type' => $type, 'document_id' => $id,
            'actor_id' => $actor['id'] ?? null,
            'actor_name' => $actor['fullName'] ?? $actor['username'] ?? 'Pengguna tidak diketahui',
            'reason' => trim($reason), 'changes' => json_encode($changes, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), 'created_at' => now(),
        ]);
    }

    public function forDocument(string $type, string $id)
    {
        return DB::table('document_edit_history')->where('document_type', $type)->where('document_id', $id)->orderByDesc('id')->get()->each(function ($entry) {
            $entry->changes = json_decode($entry->changes, true) ?: [];
            $entry->changes = array_values(array_filter(array_map(function ($change) {
                if (($change['field'] ?? null) !== 'items' || ! is_array($change['before'] ?? null) || ! is_array($change['after'] ?? null)) return $change;
                $before = array_values($change['before']);
                $after = array_values($change['after']);
                $key = fn ($item) => json_encode([(string) ($item['description'] ?? ''), (float) ($item['quantity'] ?? 0), (string) ($item['unit'] ?? ''), (float) ($item['unitPrice'] ?? 0)], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
                foreach ($before as $index => $item) {
                    foreach ($after as $afterIndex => $candidate) {
                        if ($key($item) === $key($candidate)) {
                            unset($before[$index], $after[$afterIndex]);
                            break;
                        }
                    }
                }
                if (! $before && ! $after) return null;
                $change['before'] = array_values($before);
                $change['after'] = array_values($after);
                return $change;
            }, $entry->changes)));
        });
    }
}
