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

$creator_id = $_SESSION['id'];
$data = $_POST;

// Required fields check
$required = ['name','description','location','start_date','start_time','end_date','end_time','is_private','capacity','event_type','upload_id'];
foreach ($required as $field) {
    if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
        http_response_code(400);
        echo json_encode(['error' => "Missing or empty field: $field"]);
        exit();
    }
}

// Validate upload_id exists
$uploadId = (int)$data['upload_id'];
$checkStmt = $pdo->prepare("SELECT upload_id FROM uploads WHERE upload_id = ?");
$checkStmt->execute([$uploadId]);
if (!$checkStmt->fetch()) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid upload_id']);
    exit();
}

// Inputs
$name        = trim($data['name']);
$description = trim($data['description']);
$location    = trim($data['location']);
$startDate   = $data['start_date'];
$startTime   = $data['start_time'];
$endDate     = $data['end_date'];
$endTime     = $data['end_time'];
$isPrivate   = $data['is_private'] === 'true' ? 1 : 0;
$notices     = $data['notices'] ?? '';
$capacity    = (int)$data['capacity'];
$eventType   = strtolower(trim($data['event_type']));
$imagePath   = null;
if (isset($_FILES['event_image']) && $_FILES['event_image']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = __DIR__ . '/uploads/events/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0775, true);
    $fileTmpPath = $_FILES['event_image']['tmp_name'];
    $fileName = basename($_FILES['event_image']['name']);
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowedExts = ['jpg','jpeg','png','gif','webp'];
    if (!in_array($fileExt,$allowedExts)) {
        http_response_code(400);
        echo json_encode(['error'=>'Invalid file type']);
        exit();
    }
    $newFileName = uniqid('event_', true).'.'.$fileExt;
    $destPath = $uploadDir.$newFileName;
    if (!move_uploaded_file($fileTmpPath,$destPath)) {
        http_response_code(500);
        echo json_encode(['error'=>'Failed to save image']);
        exit();
    }
    $imagePath = 'uploads/events/'.$newFileName;
}

// Generate attendance code
function generateAttendanceCode($length=6){ return strtoupper(substr(bin2hex(random_bytes($length)),0,$length)); }
$attendanceCode = generateAttendanceCode();

// Insert event
try {
    $stmt = $pdo->prepare("
        INSERT INTO events 
        (name, description, location, start_date, start_time, end_date, end_time, 
         is_private, notices, capacity, event_type, created_by, image, attendance_code, upload_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING event_id
    ");
    $stmt->execute([
        $name,$description,$location,
        $startDate,$startTime,$endDate,$endTime,
        $isPrivate,$notices,$capacity,$eventType,
        $creator_id,$imagePath,$attendanceCode,$uploadId
    ]);
    $eventId = $stmt->fetchColumn();
    if($eventId){
        echo json_encode([
            "success"=>true,
            "message"=>"Event created successfully",
            "event_id"=>$eventId,
            "upload_id"=>$uploadId
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["error"=>"Failed to create event"]);
    }
}catch(PDOException $e){
    error_log("Database error: ".$e->getMessage());
    http_response_code(500);
    echo json_encode(["error"=>"Database error: ".$e->getMessage()]);
}
?>
