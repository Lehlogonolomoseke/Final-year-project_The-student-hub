<?php
session_start();
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:3000");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Function to send JSON response and exit
function sendJsonResponse($data, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode($data);
    exit();
}

try {
    $dbPath = 'db_supabase.php';
    if (!file_exists($dbPath)) {
        throw new Exception('Database connection file not found: ' . $dbPath);
    }
    
    require_once $dbPath;
    
    // Get database connection
    $pdo = getSupabaseConnection();
    
    if (!$pdo) {
        throw new Exception('Database connection failed');
    }
    
    // Get table columns info for events table (PostgreSQL way)
    $columnsResult = $pdo->query("
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public'
    ");
    $columns = [];
    while ($row = $columnsResult->fetch()) {
        $columns[] = $row['column_name'];
    }
    
    // Check if society_id column exists
    $hasSocietyId = in_array('society_id', $columns);
    
    if ($hasSocietyId) {
        // Use society_id using Unknown Society because of my table
        $sql = "SELECT 
                    e.event_id,
                    e.name,
                    e.start_date,
                    e.end_date,
                    COALESCE(s.name, 'Unknown Society') as society_name
                FROM events e
                LEFT JOIN societies s ON e.society_id = s.society_id
                ORDER BY e.start_date ASC
                LIMIT 50";
    } else {
        // Use created_by and link society admin_user_id made life difficult here 
        $sql = "SELECT 
                    e.event_id,
                    e.name,
                    e.start_date,
                    e.end_date,
                    e.image,
                    e.location,
                    e.is_private,
                    COALESCE(s.name, 'Unknown Society') as society_name
                FROM events e
                LEFT JOIN societies s ON e.created_by = s.admin_user_id
                ORDER BY e.start_date ASC
                LIMIT 50";
    }
    
    $result = $pdo->prepare($sql);
    $result->execute();
    
    if (!$result) {
        throw new Exception('Query failed');
    }
    
    $events = [];
    while ($row = $result->fetch()) {
        $events[] = $row;
    }
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Events retrieved successfully',
        'count' => count($events),
        'events' => $events,
        'debug_info' => [
            'query_executed' => $sql,
            'events_table_columns' => $columns,
            'has_society_id_column' => $hasSocietyId,
            'events_with_society' => count(array_filter($events, function($event) {
                return !empty($event['society_name']) && $event['society_name'] !== 'Unknown Society';
            }))
        ]
    ]);
    
} catch (Exception $e) {
    // Send error response
    sendJsonResponse([
        'success' => false,
        'error' => $e->getMessage(),
        'debug_info' => [
            'php_version' => phpversion(),
            'file_path' => __FILE__,
            'working_directory' => getcwd(),
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], 500);
}
?>