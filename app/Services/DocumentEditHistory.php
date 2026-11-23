<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DocumentEditHistory
{
    public function record(Request $request, string $type, string $id, object $before, array $after, $oldItems, array $newItems, string $reason): void
    {
        $changes = [];
        foreach ($after as $field => $value) {
            $old = $before->{$field} ?? null;
            $numeric = in_array($field, ['amount', 'subtotal', 'discount', 'taxPercent', 'taxAmount', 'grandTotal'], true);
            if ($numeric ? (float) $old !== (float) $value : (string) ($old ?? '') !== (string) ($value ?? '')) {
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
        });
    }
}
