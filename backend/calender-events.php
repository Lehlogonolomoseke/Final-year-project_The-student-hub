<?php
session_start();
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:3000");
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Helper function to send JSON response
function sendJsonResponse($data, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode($data);
    exit();
}

try {
    require_once 'db_supabase.php';
    $pdo = getSupabaseConnection();
    if (!$pdo) throw new Exception("Database connection failed");

    // Check if table has society_id column
    $columnsResult = $pdo->query("
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public'
    ");
    $columns = [];
    while ($row = $columnsResult->fetch()) $columns[] = $row['column_name'];
    $hasSocietyId = in_array('society_id', $columns);

    // Query all relevant fields
    if ($hasSocietyId) {
        $sql = "SELECT 
                    e.event_id,
                    e.name,
                    e.start_date,
                    e.end_date,
                    e.image,
                    e.location,
                    e.is_private,
                    e.capacity,
                    e.event_type,
                    COALESCE(s.name, 'Unknown Society') AS society_name
                FROM events e
                LEFT JOIN societies s ON e.society_id = s.society_id
                ORDER BY e.start_date ASC
                LIMIT 50";
    } else {
        $sql = "SELECT 
                    e.event_id,
                    e.name,
                    e.start_date,
                    e.end_date,
                    e.image,
                    e.location,
                    e.is_private,
                    e.capacity,
                    e.event_type,
                    COALESCE(s.name, 'Unknown Society') AS society_name
                FROM events e
                LEFT JOIN societies s ON e.created_by = s.admin_user_id
                ORDER BY e.start_date ASC
                LIMIT 50";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendJsonResponse([
        'success' => true,
        'message' => 'Events retrieved successfully',
        'count' => count($events),
        'events' => $events,
        'debug_info' => [
            'query_executed' => $sql,
            'events_table_columns' => $columns,
            'has_society_id_column' => $hasSocietyId
        ]
    ]);

} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'message' => $e->getMessage(),
        'debug_info' => [
            'php_version' => phpversion(),
            'file_path' => __FILE__,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], 500);
}
?>
