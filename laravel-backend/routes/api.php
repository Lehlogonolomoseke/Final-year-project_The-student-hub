<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Admin\EventController;
Route::options('/login', function () {
    return response('', 200, [
        'Access-Control-Allow-Origin' => 'http://localhost:3000',
        'Access-Control-Allow-Methods' => 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials' => 'true',
    ]);
});

Route::post('/login', [LoginController::class, 'login']);


Route::middleware('auth')->post('/admin/create-event', [EventController::class, 'store']);
