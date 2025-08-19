<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    session_start();
    require_once "db_supabase.php";

    if (!isset($_SESSION['id']) || !isset($_SESSION['role'])) {
        echo json_encode([
            'error' => 'Session not properly set',
            'debug' => [
                'session_id_exists' => isset($_SESSION['id']),
                'session_role_exists' => isset($_SESSION['role']),
                'session_role_value' => $_SESSION['role'] ?? 'not set'
            ]
        ]);
        exit();
    }

    if ($_SESSION['role'] !== 'MASTER') {
        http_response_code(403);
        echo json_encode([
            'error' => 'Access denied',
            'debug' => [
                'current_role' => $_SESSION['role'],
                'required_role' => 'MASTER'
            ]
        ]);
        exit();
    }

    $pdo = getSupabaseConnection();

    if (!$pdo) {
        echo json_encode(['error' => 'Database connection failed']);
        exit();
    }

    // File download logic
    if (isset($_GET['download']) && isset($_GET['id'])) {
        $fileId = intval($_GET['id']);

        $stmt = $pdo->prepare("
            SELECT u.file_name, u.file_path, us.first_name, us.last_name 
            FROM uploads u 
            LEFT JOIN users us ON u.uploaded_by = us.id 
            WHERE u.upload_id = ?
        ");
        $stmt->execute([$fileId]);
        $result = $stmt->fetch();

        if (!$result) {
            http_response_code(404);
            echo json_encode(['error' => 'File not found in database']);
            exit();
        }

        $fileName = $result['file_name'];
        $filePath = $result['file_path'];

        if (!file_exists($filePath)) {
            http_response_code(404);
            echo json_encode(['error' => 'File not found on server at path: ' . $filePath]);
            exit();
        }

        $fileSize = filesize($filePath);
        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';

        if (ob_get_level()) {
            ob_clean();
        }

        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: attachment; filename="' . $fileName . '"');
        header('Content-Length: ' . $fileSize);
        header('Cache-Control: must-revalidate');
        header('Pragma: public');

        readfile($filePath);
        exit();
    }

    // Priority logic
    function calculatePriority($daysUntilEvent) {
        if ($daysUntilEvent <= 7) return 'urgent';
        if ($daysUntilEvent <= 10) return 'high';
        if ($daysUntilEvent <= 14) return 'medium';
        return 'low';
    }

    function getTimeStatus($eventDate) {
        $today = new DateTime();
        $event = new DateTime($eventDate);
        $diff = $today->diff($event);

        if ($event < $today) {
            return 'OVERDUE';
        } elseif ($diff->days == 0) {
            return 'TODAY';
        } elseif ($diff->days == 1) {
            return 'TOMORROW';
        } else {
            return $diff->days . ' days left';
        }
    }

   
    $query = "
        SELECT 
            u.upload_id AS id,
            u.file_name,
            u.uploaded_at,
            u.event_date,
            u.file_path,
            u.status,
            us.first_name,
            us.last_name,
            us.role,
            (u.event_date - CURRENT_DATE)::int AS days_until_event,

            CASE 
                WHEN us.role IN ('ADMIN', 'DAYHOUSE') THEN us.first_name
                WHEN us.first_name IS NOT NULL THEN us.first_name || ' ' || COALESCE(us.last_name, '')
                ELSE 'Unknown Sender'
            END AS display_society_name,

            CASE 
                WHEN u.event_date < CURRENT_DATE THEN 'OVERDUE'
                WHEN (u.event_date - CURRENT_DATE) = 0 THEN 'TODAY'
                WHEN (u.event_date - CURRENT_DATE) = 1 THEN 'TOMORROW'
                ELSE ((u.event_date - CURRENT_DATE)::int || ' days left')
            END AS time_status

        FROM uploads u 
        LEFT JOIN users us ON u.uploaded_by = us.id 

        ORDER BY 
            CASE 
                WHEN (u.event_date - CURRENT_DATE) <= 3 THEN 4
                WHEN (u.event_date - CURRENT_DATE) <= 7 THEN 3
                WHEN (u.event_date - CURRENT_DATE) <= 14 THEN 2
                ELSE 1
            END DESC,
            u.event_date ASC,
            u.uploaded_at DESC
    ";

    $stmt = $pdo->prepare($query);
    $stmt->execute();

    $data = [];

    while($row = $stmt->fetch()) {
        $daysUntilEvent = $row['days_until_event'];
        $priority = calculatePriority($daysUntilEvent);

        $data[] = [
            'id' => $row['id'],
            'file_name' => $row['file_name'],
            'uploaded_at' => $row['uploaded_at'],
            'event_date' => $row['event_date'],
            'days_until_event' => $daysUntilEvent,
            'status' => $row['status'],
            'priority' => $priority,
            'society_name' => $row['display_society_name'],
            'time_status' => $row['time_status'],
            'file_path' => 'http://localhost:8000/uploads/' . basename($row['file_path']),
            'uploader_name' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
            'is_overdue' => $daysUntilEvent < 0
        ];
    }

    if (ob_get_length()) {
        ob_clean();
    }

    echo json_encode($data);

} catch (Exception $e) {
    error_log("view_files.php Error: " . $e->getMessage());
    echo json_encode([
        'error' => 'Server error occurred',
        'message' => $e->getMessage(),
        'line' => $e->getLine(),
        'file' => $e->getFile()
    ]);
}
?>
