<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class LoginController extends Controller
{
    public function login(Request $request)
    {
        $headers = [
            'Access-Control-Allow-Origin' => 'http://localhost:3000',
            'Access-Control-Allow-Methods' => 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials' => 'true',
        ];

        if ($request->getMethod() === 'OPTIONS') {
            return response('', 200, $headers);
        }

        try {
            $request->validate([
                'email'    => 'required|email',
                'password' => 'required'
            ]);

            $user = User::where('Email', $request->email)->first();

            if (!$user) {
                return response()->json(['error' => 'No account found with that email'], 401)
                    ->withHeaders($headers); // Add headers here
            }

            if (!Hash::check($request->password, $user->Password)) {
                return response()->json(['error' => 'Incorrect password'], 401)
                    ->withHeaders($headers); // Add headers here
            }

            $token = $user->createToken('auth-token')->plainTextToken;

            $role = strtolower($user->role);
            $email = strtolower($user->Email);
            $redirect = match (true) {
                $email === "portia@gmail.com" && $role === "master" => '/SP/view_file',
                $role === "admin" => '/admin/send-file',
                default => '/Student/search'
            };

            return response()->json([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id'         => $user->id,
                    'first_name' => $user->First_Name,
                    'email'      => $user->Email,
                    'role'       => $user->role
                ],
                'redirect' => $redirect
            ])->withHeaders($headers); // Add headers here

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Login failed: ' . $e->getMessage()
            ], 500)->withHeaders($headers); // Add headers here
        }
    }
}