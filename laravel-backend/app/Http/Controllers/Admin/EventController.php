<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;
use App\Models\Event; // Assuming you have an Event model

class EventController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        // Make sure user is authenticated and is an ADMIN
        $user = Auth::user();

        if (!$user || strtolower($user->role) !== 'admin') {
            return response()->json(['error' => 'Unauthorized access'], 401);
        }

        // Validate request
        $validator = Validator::make($request->all(), [
            'name'         => 'required|string|max:255',
            'description'  => 'required|string',
            'location'     => 'required|string|max:255',
            'start_date'   => 'required|date',
            'start_time'   => 'required|date_format:H:i',
            'end_date'     => 'required|date|after_or_equal:start_date',
            'end_time'     => 'required|date_format:H:i',
            'is_private' => 'required|in:true,false,1,0',
            'notices'      => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        // Create the event
        $event = Event::create([
            'name'         => $request->name,
            'description'  => $request->description,
            'location'     => $request->location,
            'start_date'   => $request->start_date,
            'start_time'   => $request->start_time,
            'end_date'     => $request->end_date,
            'end_time'     => $request->end_time,
            'is_private'   => $request->is_private,
            'notices'      => $request->notices,
            'created_by'   => $user->id,
        ]);

        return response()->json(['message' => 'Event created successfully', 'event' => $event], 201);
    }
}

