<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
session_start();

require_once 'db_supabase.php';

try {
    $pdo = getSupabaseConnection(); 
} catch (Exception $e) {
    error_log("Database connection error in Search_Student.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed'
    ]);
    exit();
}

$searchTerm = isset($_GET['search']) ? trim($_GET['search']) : '';

try {
    if ($searchTerm !== '') {
        $likeTerm = "%" . $searchTerm . "%";
        $stmt = $pdo->prepare("
            SELECT society_id, name, description, category, logo_url, admin_user_id, created_at
            FROM societies
            WHERE name ILIKE ? OR description ILIKE ? OR category ILIKE ?
            ORDER BY name ASC
        ");
        $stmt->execute([$likeTerm, $likeTerm, $likeTerm]);
    } else {
        // Get all societies 
        $stmt = $pdo->prepare("
            SELECT society_id, name, description, category, logo_url, admin_user_id, created_at
            FROM societies
            ORDER BY name ASC
        ");
        $stmt->execute();
    }

    // Fetching results
    $societies = $stmt->fetchAll();
    foreach ($societies as &$society) {
        if ($society['created_at']) {
        
            $society['created_at'] = date('Y-m-d H:i:s', strtotime($society['created_at']));
        }
    }

    echo json_encode([
        "success" => true,
        "results" => $societies,
        "count" => count($societies)
    ]);
    exit();

} catch (Exception $e) {
    error_log("Search error in Search_Student.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Server error while fetching societies'
    ]);
    exit();
}
?>