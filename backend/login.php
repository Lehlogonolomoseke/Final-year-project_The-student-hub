<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session
session_start();

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Get and validate input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
    exit();
}

$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email and Password are required']);
    exit();
}

try {
    require_once('db_supabase.php');
    
    $pdo = getSupabaseConnection();
    
    // Prepare and execute query (PostgreSQL syntax) - INCLUDE EMAIL in SELECT
    $statement = $pdo->prepare("SELECT id, first_name, last_name, email, password, role FROM users WHERE email = ?");
    $statement->execute([$email]);
    
    // Get user data
    $user = $statement->fetch();
    
    // Check if user exists
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'No account found with that email']);
        exit();
    }
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Incorrect password']);
        exit();
    }
    
    if (!headers_sent()) {
        session_regenerate_id(true);
    }
    $_SESSION["id"] = $user['id'];
    $_SESSION["first_name"] = $user['first_name'];
    $_SESSION["email"] = $user['email'];
    $_SESSION["role"] = $user['role'];

    $response = [
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'first_name' => $user['first_name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ];
    
    if (strtolower($user['email']) === "portia@gmail.com" && strtolower($user['role']) === "master") {
        $response['redirect'] = '/sp/view-file';
    } elseif (strtolower($user['role']) === "admin" || strtolower($user['role']) === "dayhouse") {
        $response['redirect'] = '/admin/send-file';
    } else {
        $response['redirect'] = '/student/home';
        
    }

    http_response_code(200);
    echo json_encode($response);
    exit();
    
} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error occurred']);
    exit();
}
?>