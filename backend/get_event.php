<?php

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}


function sendJsonResponse($data, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode($data);
    exit();
}

try {
    
    $dbPath = 'db_supabase.php';
    if (!file_exists($dbPath)) {
        
        sendJsonResponse([
            "success" => false,
            "message" => "Database connection file not found: " . $dbPath
        ], 500);
    }
    

    require_once $dbPath;

    
    $pdo = getSupabaseConnection();

    
    if (!$pdo) {
        sendJsonResponse([
            "success" => false,
            "message" => "Database connection failed"
        ], 500);
    }

    
    if (!isset($_GET['event_id'])) {
        sendJsonResponse([
            "success" => false,
            "message" => "Missing event_id parameter"
        ], 400); 
    }

    $event_id = intval($_GET['event_id']);


    $stmt = $pdo->prepare("SELECT * FROM events WHERE event_id = ?");
    $stmt->execute([$event_id]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($event) {
        // Return the event data as a JSON object
        sendJsonResponse([
            "success" => true,
            "event" => $event
        ]);
    } else {
        // Event not found
        sendJsonResponse([
            "success" => false,
            "message" => "Event not found"
        ], 404);
    }

} catch (Exception $e) {

    error_log("General Error: " . $e->getMessage());
    sendJsonResponse([
        "success" => false,
        "message" => "An unexpected error occurred."
    ], 500);
}
?>