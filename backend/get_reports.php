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

// Check if user is logged in and is student
if (!isset($_SESSION['id']) || $_SESSION['role'] !== 'MASTER') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'authentication required']);
    exit();
    
}

try {
    require_once('db_supabase.php');
    $pdo = getSupabaseConnection();

    // Get all reports sent to student practitioners
    $sql = "SELECT 
                sr.report_id,
                sr.event_name,
                sr.event_date,
                sr.pdf_file_path,
                sr.admin_message,
                sr.status,
                sr.sent_at,
                sr.viewed_at,
                u.first_name as admin_first_name,
                u.last_name as admin_last_name
            FROM sent_reports sr
            LEFT JOIN users u ON sr.sent_by = u.id
            ORDER BY sr.sent_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Add file URLs for easier access
    foreach ($reports as &$report) {
        $report['pdf_url'] = 'http://localhost:8000/' . $report['pdf_file_path'];
    }

    echo json_encode([
        'success' => true,
        'reports' => $reports
    ]);

} catch (Exception $e) {
    error_log("Get sent reports error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch reports: ' . $e->getMessage()]);
}
?>