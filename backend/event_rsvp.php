<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

// Check user authentication
if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

$user_id = $_SESSION['id'];

require_once('db_supabase.php');

try {
    $pdo = getSupabaseConnection();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Fetch RSVP status for user & event
        $event_id = intval($_GET['event_id'] ?? 0);
        if ($event_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid event_id']);
            exit();
        }

        $stmt = $pdo->prepare("SELECT status FROM event_rsvps WHERE user_id = ? AND event_id = ?");
        $stmt->execute([$user_id, $event_id]);
        $rsvp = $stmt->fetch();

        echo json_encode([
            'success' => true,
            'status' => $rsvp ? $rsvp['status'] : null
        ]);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Receive and validate JSON input
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON data']);
            exit();
        }

        $event_id = intval($input['event_id'] ?? 0);
        $status = strtolower(trim($input['status'] ?? ''));

        $allowed_statuses = ['intrested', 'not intrested'];

        if ($event_id <= 0 || !in_array($status, $allowed_statuses, true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid event_id or status']);
            exit();
        }

        // Check if RSVP record exists
        $stmt = $pdo->prepare("SELECT id FROM event_rsvps WHERE user_id = ? AND event_id = ?");
        $stmt->execute([$user_id, $event_id]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Update RSVP
            $stmt = $pdo->prepare("UPDATE event_rsvps SET status = ? WHERE id = ?");
            $stmt->execute([$status, $existing['id']]);
        } else {
            // Insert new RSVP
            $stmt = $pdo->prepare("INSERT INTO event_rsvps (user_id, event_id, status) VALUES (?, ?, ?)");
            $stmt->execute([$user_id, $event_id, $status]);
        }

        echo json_encode(['success' => true, 'message' => 'RSVP status updated']);
        exit();
    }

    // If method not allowed
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();

} catch (Exception $e) {
    error_log("event_rsvp.php error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
    exit();
}
