<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "db_supabase.php";

// 1. Authentication
if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required.']);
    exit();
}

$user_id = $_SESSION['id'];

// 2. Input Validation
$input = json_decode(file_get_contents('php://input'), true);
$announcement_id = filter_var($input['announcement_id'] ?? 0, FILTER_VALIDATE_INT);

if (empty($announcement_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Announcement ID is required.']);
    exit();
}

try {
    $pdo = getSupabaseConnection();

    // 3. Database Insertion
    // Use ON CONFLICT to avoid errors if the user reads the same announcement multiple times.
    // This is more efficient than checking for existence first.
    $sql = "INSERT INTO announcement_reads (announcement_id, user_id) VALUES (?, ?) ON CONFLICT (announcement_id, user_id) DO NOTHING";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$announcement_id, $user_id]);

    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Announcement marked as read.']);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Mark as read error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error occurred.']);
}
?>