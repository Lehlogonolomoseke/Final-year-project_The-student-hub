<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    
    if (!file_exists("db_supabase.php")) {
        throw new Exception("Database connection file not found");
    }
    
    require_once "db_supabase.php";
    
    
    if (!function_exists('getSupabaseConnection')) {
        throw new Exception("getSupabaseConnection function not found");
    }
    
    $pdo = getSupabaseConnection();
    
    if (!$pdo) {
        throw new Exception("Failed to get database connection");
    }
    
     //user id
    $user_id = $_SESSION['id'] ?? null;
    
    if (!$user_id) {
        echo json_encode([
            'success' => false,
            'message' => 'User not logged in',
            'debug' => 'Session ID: ' . session_id() . ', User ID: ' . var_export($user_id, true)
        ]);
        exit;
    }
    
    // Get input data
    $input = json_decode(file_get_contents('php://input'), true);
    

    error_log("Input received: " . json_encode($input));
    
    if (!$input || !isset($input['society_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Society ID is required',
            'debug' => 'Input: ' . json_encode($input)
        ]);
        exit;
    }
    
    $society_id = $input['society_id'];
    
    if (!is_numeric($society_id)) {
        echo json_encode([
            'success' => false,
            'message' => 'Invalid society ID format'
        ]);
        exit;
    }
    $societyStmt = $pdo->prepare("SELECT society_id FROM societies WHERE society_id = ?");
    if (!$societyStmt) {
        throw new Exception("Failed to prepare society validation query: " . implode(", ", $pdo->errorInfo()));
    }
    
    if (!$societyStmt->execute([$society_id])) {
        throw new Exception("Failed to execute society validation query: " . implode(", ", $societyStmt->errorInfo()));
    }
    
    if (!$societyStmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Society not found'
        ]);
        exit;
    }

    $memberStmt = $pdo->prepare("SELECT status FROM society_members WHERE user_id = ? AND society_id = ?");
    if (!$memberStmt) {
        throw new Exception("Failed to prepare membership check query: " . implode(", ", $pdo->errorInfo()));
    }
    
    if (!$memberStmt->execute([$user_id, $society_id])) {
        throw new Exception("Failed to execute membership check query: " . implode(", ", $memberStmt->errorInfo()));
    }
    
    $existingMembership = $memberStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingMembership) {
        $status = $existingMembership['status'];
        if ($status === 'approved') {
            echo json_encode([
                'success' => false,
                'message' => 'You are already a member of this society'
            ]);
            exit;
        } elseif ($status === 'pending') {
            echo json_encode([
                'success' => false,
                'message' => 'You already have a pending membership request for this society'
            ]);
            exit;
        }
    }

    $insertStmt = $pdo->prepare("
        INSERT INTO society_members (society_id, user_id, joined_at, status) 
        VALUES (?, ?, CURRENT_TIMESTAMP, 'pending')
    ");
    
    if (!$insertStmt) {
        throw new Exception("Failed to prepare insert query: " . implode(", ", $pdo->errorInfo()));
    }
    
    if (!$insertStmt->execute([$society_id, $user_id])) {
        throw new Exception("Failed to execute insert query: " . implode(", ", $insertStmt->errorInfo()));
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Membership request sent successfully!'
    ]);
    
} catch (Exception $e) {
    error_log("Join Society error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred: ' . $e->getMessage(),
        'debug' => [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]
    ]);
}
?>