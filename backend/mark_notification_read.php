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

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required.']);
    exit();
}

$user_id = $_SESSION['id'];

$input = json_decode(file_get_contents('php://input'), true);
$notification_id = filter_var($input['notification_id'] ?? 0, FILTER_VALIDATE_INT);

if (empty($notification_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Notification ID is required.']);
    exit();
}

try {
    $pdo = getSupabaseConnection();

    $sql = "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$notification_id, $user_id]);

    echo json_encode(['success' => true, 'message' => 'Notification marked as read.']);
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Mark notification read error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error occurred.']);
}
?>
