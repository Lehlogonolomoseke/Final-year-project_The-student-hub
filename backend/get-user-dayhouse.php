<?php

session_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Database connection
    require_once "db_supabase.php";
    $pdo = getSupabaseConnection();
    
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }

    $userId = $_SESSION['id'] ?? null;

    if (!$userId || empty($userId)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Not logged in']);
        exit;
    }

    $userId = intval($userId);

    // Get user info with role validation
    $userQuery = "SELECT id, first_name, last_name, email, role FROM users WHERE id = ?";
    $userStmt = $pdo->prepare($userQuery);
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }
    
    // Check user role permissions
    $allowedRoles = ['DAYHOUSE', 'ADMIN', 'MASTER'];
    if (!in_array($user['role'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'error' => 'Insufficient permissions. Only dayhouse managers can access this.',
            'user_role' => $user['role']
        ]);
        exit;
    }

    $dayhouse_id = null;
    $dayhouse_details = null;
    if ($user['role'] === 'DAYHOUSE') {
        $managerQuery = "SELECT id, name, description, image FROM dayhouses WHERE manager_id = ? LIMIT 1";
        $managerStmt = $pdo->prepare($managerQuery);
        $managerStmt->execute([$userId]);
        $dayhouse = $managerStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($dayhouse) {
            $dayhouse_id = $dayhouse['id'];
            $dayhouse_details = $dayhouse;
        }
    } elseif (in_array($user['role'], ['ADMIN', 'MASTER'])) {

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'user_role' => $user['role'],
            'user_name' => trim($user['first_name'] . ' ' . $user['last_name']),
            'admin_access' => true,
            'message' => 'Admin/Master user with elevated permissions'
        ]);
        exit;
    }

    if ($dayhouse_id && $dayhouse_details) {
        http_response_code(200);
        echo json_encode([
            'success' => true, 
            'dayhouse_id' => intval($dayhouse_id),
            'user_role' => $user['role'],
            'user_name' => trim($user['first_name'] . ' ' . $user['last_name']),
            'dayhouse_details' => [
                'id' => intval($dayhouse_details['id']),
                'name' => $dayhouse_details['name'],
                'description' => $dayhouse_details['description'],
                'image' => $dayhouse_details['image']
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false, 
            'error' => 'No dayhouse found for this user. Please contact an administrator to assign you to a dayhouse.',
            'user_role' => $user['role'],
            'user_name' => trim($user['first_name'] . ' ' . $user['last_name'])
        ]);
    }

} catch (PDOException $e) {
    // Log database error
    error_log("Get User Dayhouse Database Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "error" => "Database error occurred"
    ]);
    
} catch (Exception $e) {
    // Log general error
    error_log("Get User Dayhouse Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "error" => "Internal server error"
    ]);
}

?>