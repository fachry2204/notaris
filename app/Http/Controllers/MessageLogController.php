<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MessageLogController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => 'nullable|string|max:200',
            'channel' => 'nullable|in:email,whatsapp',
            'status' => 'nullable|in:SENDING,ACCEPTED,FAILED',
            'position' => 'nullable|in:STAFFADMIN,OB,ADMINISTRATOR,PIMPINAN,CLIENT,TEST',
            'page' => 'nullable|integer|min:1|max:100000',
        ]);
        $query = DB::table('message_logs');
        foreach (['channel' => 'channel', 'status' => 'status', 'position' => 'recipient_position'] as $filter => $column) {
            if (!empty($filters[$filter])) $query->where($column, $filters[$filter]);
        }
        if (!empty($filters['q'])) {
            $term = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $filters['q']).'%';
            $query->where(function ($query) use ($term) {
                foreach (['recipient_name', 'phone', 'destination'] as $column) {
                    $query->orWhereRaw("$column LIKE ? ESCAPE '!'", [$term]);
                }
            });
        }

        return response()->json($query->select('id', 'category', 'channel', 'recipient_name', 'recipient_position', 'phone', 'destination', 'status', 'created_at')
            ->orderByDesc('created_at')->orderByDesc('id')->paginate(15));
    }

    public function show(string $id)
    {
        $message = DB::table('message_logs')->where('id', $id)->first();
        abort_unless($message, 404);
        return response()->json($message);
    }
}
