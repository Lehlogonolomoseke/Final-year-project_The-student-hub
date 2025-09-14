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

// Check if user is logged in and is student
if (!isset($_SESSION['id']) || $_SESSION['role'] !== 'student') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Student authentication required']);
    exit();
}

try {
    require_once('db_supabase.php');
    $pdo = getSupabaseConnection();

    $input = json_decode(file_get_contents('php://input'), true);
    $reportId = $input['report_id'] ?? null;

    if (!$reportId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Report ID is required']);
        exit();
    }

    // Update the report to mark as viewed
    $sql = "UPDATE sent_reports 
            SET status = 'viewed', viewed_at = NOW() 
            WHERE report_id = ? AND status = 'sent'";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([$reportId]);

    if ($stmt->rowCount() > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Report marked as viewed'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'message' => 'Report already viewed or not found'
        ]);
    }

} catch (Exception $e) {
    error_log("Mark report viewed error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to update report status: ' . $e->getMessage()]);
}
?>