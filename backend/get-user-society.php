<?php

session_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
    // Check if user is logged in
    if (!isset($_SESSION['id']) || empty($_SESSION['id'])) {
        http_response_code(401);
        echo json_encode([
            "success" => false, 
            "error" => "User not logged in"
        ]);
        exit;
    }

    // Database connection
    require_once "db_supabase.php";
    $pdo = getSupabaseConnection();
    
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }

    $user_id = intval($_SESSION['id']);
    
    // Validate user exists
    $userCheck = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $userCheck->execute([$user_id]);
    
    if (!$userCheck->fetch()) {
        http_response_code(404);
        echo json_encode([
            "success" => false, 
            "error" => "User not found"
        ]);
        exit;
    }

    // Get the society where this user is an admin
    $query = "SELECT society_id, name, description, category, logo_url, created_at FROM societies WHERE admin_user_id = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$user_id]);
    $society = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($society) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "society_id" => $society['society_id'],
            "user_id" => $user_id,
            "society_details" => [
                "society_id" => $society['society_id'],
                "name" => $society['name'],
                "description" => $society['description'],
                "category" => $society['category'],
                "logo_url" => $society['logo_url'],
                "created_at" => $society['created_at']
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "error" => "No society found for this user",
            "user_id" => $user_id
        ]);
    }

} catch (PDOException $e) {
    // Log database error
    error_log("Get User Society Database Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database error occurred"
    ]);
    
} catch (Exception $e) {
    // Log general error
    error_log("Get User Society Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Internal server error"
    ]);
}

?>