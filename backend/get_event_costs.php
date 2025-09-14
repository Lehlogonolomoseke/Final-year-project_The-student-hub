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

$pdo = getSupabaseConnection();

// Check if user is authenticated
if (!isset($_SESSION['id'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit();
}

$event_id = $_GET['event_id'] ?? null;

if (!$event_id) {
    echo json_encode(['success' => false, 'error' => 'Event ID is required']);
    exit();
}

try {
    // First, get the event details to see the upload_id
    $event_stmt = $pdo->prepare("SELECT upload_id FROM events WHERE event_id = ?");
    $event_stmt->execute([$event_id]);
    $event = $event_stmt->fetch();
    
    $debug_info = [
        'event_id' => $event_id,
        'event_upload_id' => $event['upload_id'] ?? 'NULL'
    ];
    
    if (!$event || !$event['upload_id']) {
        echo json_encode([
            'success' => false,
            'error' => 'Event not found or no upload_id',
            'debug' => $debug_info,
            'costs' => []
        ]);
        exit();
    }
    
    // Get event costs directly using upload_id
    $stmt = $pdo->prepare("
        SELECT 
            id,
            name,
            budget,
            comments,
            upload_id
        FROM event_costs 
        WHERE upload_id = ?
        ORDER BY name
    ");
    
    $stmt->execute([$event['upload_id']]);
    $costs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $debug_info['costs_found'] = count($costs);
    $debug_info['costs_sample'] = array_slice($costs, 0, 2); // First 2 for debugging

    // Convert budget to float to ensure proper calculation
    foreach ($costs as &$cost) {
        $cost['budget'] = floatval($cost['budget']);
    }

    echo json_encode([
        'success' => true,
        'costs' => $costs,
        'debug' => $debug_info
    ]);

} catch (Exception $e) {
    error_log("Error fetching event costs: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch event costs: ' . $e->getMessage(),
        'costs' => [],
        'debug' => ['exception' => $e->getMessage()]
    ]);
}
?>