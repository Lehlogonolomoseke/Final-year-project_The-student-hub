<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once "db_supabase.php";

error_log("Session data: " . print_r($_SESSION, true));

$pdo = getSupabaseConnection();

// Auth check
if (!isset($_SESSION['id']) || $_SESSION['role'] !== 'ADMIN') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit();
}

try {
    $admin_id = $_SESSION['id'];

    $debug_info = [
        'session_admin_id' => $admin_id,
        'session_role' => $_SESSION['role'],
        'admin_id_type' => gettype($admin_id)
    ];

    // Attempt to find matching society
    $society_stmt = $pdo->prepare("SELECT society_id, admin_user_id, name FROM societies WHERE admin_user_id = ?");
    $society_stmt->execute([$admin_id]);
    $society_result = $society_stmt->fetch();

    $debug_info['society_query_result'] = $society_result;

    if (!$society_result) {
        $society_stmt2 = $pdo->prepare("SELECT society_id, admin_user_id, name FROM societies WHERE CAST(admin_user_id AS TEXT) = CAST(? AS TEXT)");
        $society_stmt2->execute([$admin_id]);
        $society_result = $society_stmt2->fetch();
        $debug_info['string_comparison_result'] = $society_result;
    }

    if (!$society_result) {
        echo json_encode([
            'success' => false,
            'error' => 'No society found for this admin',
            'debug' => $debug_info
        ]);
        exit();
    }

    $society_id = $society_result['society_id'];

    // Updated SQL with fixed date subtraction
    $sql = "
        SELECT 
            u.upload_id,
            u.file_name,
            u.event_date,
            u.uploaded_at,
            u.status,
            (u.event_date - CURRENT_DATE) AS days_until_event,
            r.venue_details,
            r.comments,
            r.response_date
        FROM uploads u
        LEFT JOIN responses r ON u.upload_id = r.upload_id
        WHERE u.uploaded_by IN (
            SELECT admin_user_id FROM societies WHERE society_id = ?
        )
        ORDER BY u.uploaded_at DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$society_id]);

    $events = [];
    while ($row = $stmt->fetch()) {
        // Ensure past events don't go negative
        $days_until = (int)$row['days_until_event'];
        if ($days_until < 0) {
            $days_until = 0;
        }

        $events[] = [
            'upload_id' => $row['upload_id'],
            'file_name' => $row['file_name'],
            'event_date' => $row['event_date'],
            'uploaded_at' => $row['uploaded_at'],
            'status' => $row['status'],
            'days_until_event' => $days_until,
            'venue_details' => $row['venue_details'],
            'comments' => $row['comments'],
            'response_date' => $row['response_date']
        ];
    }

    echo json_encode([
        'success' => true,
        'events' => $events,
        'society_id' => $society_id
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
