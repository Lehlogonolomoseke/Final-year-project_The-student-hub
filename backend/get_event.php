<?php
// get_event.php

// Set headers for CORS and content type
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Function to send a JSON response and exit the script
function sendJsonResponse($data, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode($data);
    exit();
}

try {
    // Check if the database connection file exists
    $dbPath = 'db_supabase.php';
    if (!file_exists($dbPath)) {
        // Send a server error if the connection file is missing
        sendJsonResponse([
            "success" => false,
            "message" => "Database connection file not found: " . $dbPath
        ], 500);
    }
    
    // Include the database connection file
    require_once $dbPath;

    // Get the database connection from the function (assuming this is how db_supabase.php works)
    $pdo = getSupabaseConnection();

    // Validate that the connection was successful
    if (!$pdo) {
        sendJsonResponse([
            "success" => false,
            "message" => "Database connection failed"
        ], 500);
    }

    // Check for event_id in the query string
    if (!isset($_GET['event_id'])) {
        sendJsonResponse([
            "success" => false,
            "message" => "Missing event_id parameter"
        ], 400); // Bad Request
    }

    $event_id = intval($_GET['event_id']);

    // Prepare a SQL statement to fetch a single event by its ID
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
    // Handle any other unexpected errors
    error_log("General Error: " . $e->getMessage());
    sendJsonResponse([
        "success" => false,
        "message" => "An unexpected error occurred."
    ], 500);
}
?>