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

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit();
}

$userId = $_SESSION['id'];

try {
    require_once('db_supabase.php');
    $pdo = getSupabaseConnection();

    if (!isset($_FILES['event_document']) || $_FILES['event_document']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error']);
        exit();
    }

    $file = $_FILES['event_document'];
    $eventDate = $_POST['event_date'] ?? null;

    // Validate file type
    $allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/zip'
    ];

    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid file type. Only PDF, Word, images, and ZIP files are allowed.']);
        exit();
    }

    // File size limit 10MB
    if ($file['size'] > 10 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File too large. Maximum size is 10MB.']);
        exit();
    }

    $uploadDir = './uploads';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $timestamp = time();
    $randomString = substr(str_shuffle('abcdefghijklmnopqrstuvwxyz0123456789'), 0, 7);
    $cleanName = preg_replace('/[^a-zA-Z0-9.-]/', '_', $file['name']);
    $newFilename = $timestamp . '_' . $randomString . '_' . $cleanName;
    $filePath = $uploadDir . '/' . $newFilename;

    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file']);
        exit();
    }

    // Optional: calculate days until event for priority
    $daysUntilEvent = null;
    $autoPriority = 'low';
    if ($eventDate) {
        $eventDateTime = new DateTime($eventDate);
        $now = new DateTime();
        $daysUntilEvent = $eventDateTime->diff($now)->days;
        if ($daysUntilEvent <= 7) $autoPriority = 'high';
        elseif ($daysUntilEvent <= 30) $autoPriority = 'medium';
    }

    $sql = "INSERT INTO uploads (file_name, file_path, file_type, uploaded_by, event_date, days_until_event, auto_priority, status, uploaded_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW()) RETURNING upload_id, file_name, file_path";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $file['name'],
        'uploads/' . $newFilename,
        $file['type'],
        $userId,
        $eventDate,
        $daysUntilEvent,
        $autoPriority
    ]);

    $uploadData = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$uploadData) throw new Exception('Database insert failed');

    echo json_encode([
        'success' => true,
        'message' => 'File uploaded successfully',
        'upload_id' => $uploadData['upload_id'],
        'file_name' => $uploadData['file_name'],
        'file_path' => $uploadData['file_path'],
        'file_url' => '/uploads/' . $newFilename
    ]);

} catch (Exception $e) {
    if (isset($filePath) && file_exists($filePath)) unlink($filePath);
    error_log("Upload error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Upload failed: ' . $e->getMessage()]);
}
?>
