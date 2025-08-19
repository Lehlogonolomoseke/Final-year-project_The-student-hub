<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once('db_supabase.php');

try {
    $pdo = getSupabaseConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Receive and validate JSON input
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
            exit();
        }
        
        $query = trim($input['query'] ?? '');
        
        if (empty($query)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Query parameter is required']);
            exit();
        }
        
        // Insert search query into database
        $stmt = $pdo->prepare("INSERT INTO search_logs (query, searched_at) VALUES (?, NOW())");
        $result = $stmt->execute([$query]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Search query logged successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to log search query']);
        }
        exit();
    }
    
    // If method not allowed
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
    
} catch (Exception $e) {
    error_log("log_search.php error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
    exit();
}
?>