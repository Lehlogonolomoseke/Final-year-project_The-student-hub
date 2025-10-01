<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required.']);
    exit();
}

$user_id = $_SESSION['id'];

try {
    require_once "db_supabase.php";
    $pdo = getSupabaseConnection();

    $unreadOnly = isset($_GET['unread']) && $_GET['unread'] === 'true';

    $sql = "SELECT id, message, type, is_read, created_at 
            FROM notifications 
            WHERE user_id = ?";

    if ($unreadOnly) {
        $sql .= " AND is_read = false";
    }

    $sql .= " ORDER BY created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$user_id]);
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'notifications' => $notifications
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Fetch notifications error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error occurred.']);
}
?>
