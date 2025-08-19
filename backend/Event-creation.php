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

// Check if admin is logged in
if (!isset($_SESSION['id']) || $_SESSION['role'] !== 'ADMIN') {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized access']);
    exit();
}

// The Admin's ID
$creator_id = $_SESSION['id'];

$data = $_POST;

// Checking the event types
$validEventTypes = [
    'social', 'fitness', 'masterclass', 'webinar', 'conference', 
    'guest lecture', 'bootcamp', 'hackathon', 'theatre night',
    'awareness campaign', 'fundraisers', 'protest', 'other'
];

// Required fields check
$required = ['name', 'description', 'location', 'start_date', 'start_time', 'end_date', 'end_time', 'is_private', 'capacity', 'event_type'];
foreach ($required as $field) {
    if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
        http_response_code(400);
        echo json_encode(['error' => "Missing or empty field: $field"]);
        exit();
    }
}

// Validate event type
if (!in_array(strtolower($data['event_type']), $validEventTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid event type. Valid types are: ' . implode(', ', $validEventTypes)]);
    exit();
}

// Validate capacity
if (!is_numeric($data['capacity']) || $data['capacity'] <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'Capacity must be bigger than 0']);
    exit();
}

// Getting the inputs
$name        = trim($data['name']);
$description = trim($data['description']);
$location    = trim($data['location']);
$startDate   = $data['start_date'];
$startTime   = $data['start_time'];
$endDate     = $data['end_date'];
$endTime     = $data['end_time'];
$isPrivate   = $data['is_private'] === 'true' ? 1 : 0;
$notices     = isset($data['notices']) ? trim($data['notices']) : ''; 
$capacity    = (int)$data['capacity'];
$eventType   = strtolower(trim($data['event_type']));

// Image insertion
$imagePath = null;

if (isset($_FILES['event_image']) && $_FILES['event_image']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '/uploads/events/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $fileTmpPath = $_FILES['event_image']['tmp_name'];
    $fileName = basename($_FILES['event_image']['name']);
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    if (!in_array($fileExtension, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid file type']);
        exit();
    }

    $newFileName = uniqid('event_', true) . '.' . $fileExtension;
    $destPath = $uploadDir . $newFileName;

    if (!move_uploaded_file($fileTmpPath, $destPath)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save image: ' . error_get_last()['message']]);
        exit();
    }

    $imagePath = 'uploads/events/' . $newFileName;
}

// Function to generate a secure random attendance code
function generateAttendanceCode($length = 6) {
    return strtoupper(substr(bin2hex(random_bytes($length)), 0, $length));
}

$attendanceCode = generateAttendanceCode();

try {
    $stmt = $pdo->prepare("
        INSERT INTO events 
        (name, description, location, start_date, start_time, end_date, end_time, is_private, notices, capacity, event_type, created_by, image, attendance_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING event_id
    ");

    $stmt->execute([
        $name, $description, $location,
        $startDate, $startTime, $endDate, $endTime,
        $isPrivate, $notices, $capacity, $eventType, $creator_id, $imagePath, $attendanceCode
    ]);

    $eventId = $stmt->fetchColumn();
    
    if ($eventId) {
      echo json_encode([
    "success" => true,
    "message" => "Event created successfully",
    "event_id" => $eventId,
    "capacity" => $capacity,
    "event_type" => $eventType,
    "notices" => $notices,
    "attendance_code" => $attendanceCode
]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to create event"]);
    }

} catch (PDOException $e) {
    error_log("Database error in Event-creation.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Database error: " . $e->getMessage()]);
}
?>
