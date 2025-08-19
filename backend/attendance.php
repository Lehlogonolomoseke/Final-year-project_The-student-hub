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

require_once "db_supabase.php"; 
$pdo = getSupabaseConnection();

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit();
}

$userId = $_SESSION['id'];
$data = json_decode(file_get_contents("php://input"), true);
$enteredCode = strtoupper(trim($data['code'] ?? ''));

if ($enteredCode === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing attendance code']);
    exit();
}

try {
    //Find event by attendance code
    $stmt = $pdo->prepare("SELECT event_id FROM events WHERE attendance_code = ?");
    $stmt->execute([$enteredCode]);
    $event = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$event) {
        echo json_encode(['success' => false, 'message' => 'Invalid attendance code']);
        exit();
    }

    $eventId = $event['event_id'];

    $checkStmt = $pdo->prepare("SELECT id FROM event_attendance WHERE event_id = ? AND user_id = ?");
    $checkStmt->execute([$eventId, $userId]);
    if ($checkStmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'You have already checked in for this event']);
        exit();
    }

    //Record attendance
    $insertStmt = $pdo->prepare("INSERT INTO event_attendance (event_id, user_id) VALUES (?, ?)");
    $insertStmt->execute([$eventId, $userId]);

    echo json_encode(['success' => true, 'message' => 'Attendance recorded successfully']);

} catch (PDOException $e) {
    error_log("Attendance error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
