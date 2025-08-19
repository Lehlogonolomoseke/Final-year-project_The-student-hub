<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit;
}

$first_name = trim($input['first_name'] ?? '');
$last_name = trim($input['last_name'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';
$confirm_password = $input['confirm_password'] ?? '';
$role = $input['role'] ?? 'user';

$errors = [];

if (empty($first_name)) {
    $errors['first_name'] = "First name is required";
}

if (empty($last_name)) {
    $errors['last_name'] = "Last name is required";
}

if (empty($email)) {
    $errors['email'] = "Email is required";
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = "Invalid email format";
}

if (empty($password)) {
    $errors['password'] = "Password is required";
} elseif (strlen($password) < 6) {
    $errors['password'] = "Password must be at least 6 characters";
}

if ($password !== $confirm_password) {
    $errors['confirm_password'] = "Passwords do not match";
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['errors' => $errors]);
    exit;
}

try {
    require_once "db_supabase.php";
    $pdo = getSupabaseConnection();
    $statement = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $statement->execute([$email]);
    $existingUser = $statement->fetch();

    if ($existingUser) {
        http_response_code(400);
        echo json_encode(['errors' => ['email' => 'Email is already in use']]);
        exit;
    }

    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    $insert = $pdo->prepare("INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)");
    $result = $insert->execute([$first_name, $last_name, $email, $hashed_password, $role]);

    if ($result) {
        http_response_code(201);
        echo json_encode([
            'success' => true, 
            'message' => 'User registered successfully',
            'user' => [
                'first_name' => $first_name,
                'last_name' => $last_name,
                'email' => $email,
                'role' => $role
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to register user']);
    }

} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
}
?>