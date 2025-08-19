<?php

ob_start();
session_start();

// Set headers
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit();
}

require_once 'db_supabase.php';

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    ob_end_flush();
    exit();
}

try {
    $pdo = getSupabaseConnection();
    if (!$pdo) {
        throw new Exception("Failed to connect to Supabase");
    }

    if (!isset($_SESSION['id']) || $_SESSION['role'] !== 'MASTER') {
        sendJsonResponse(['error' => 'Unauthorized access'], 401);
    }

    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    // JSON-based response submission
    if (str_contains($contentType, 'application/json')) {
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            sendJsonResponse(['error' => 'Invalid JSON'], 400);
        }

        $venue_details = $input['venue_details'] ?? '';
        $comments = $input['comments'] ?? '';
        $fileId = $input['fileId'] ?? null;
        $response_type = $input['response_type'] ?? null;
        $adminId = $_SESSION['id'];

        if (!$fileId || !$response_type) {
            sendJsonResponse(['error' => 'Missing required fields: fileId or response_type'], 400);
        }

        // Get society ID
        $society_stmt = $pdo->prepare("
            SELECT s.society_id 
            FROM uploads u 
            JOIN societies s ON u.uploaded_by = s.admin_user_id 
            WHERE u.upload_id = ?
        ");
        $society_stmt->execute([$fileId]);
        $society = $society_stmt->fetch();

        if (!$society) {
            sendJsonResponse(['error' => 'No society found for this upload'], 404);
        }

        $society_id = $society['society_id'];

        // Check if a response already exists
        $existing_stmt = $pdo->prepare("SELECT response_id FROM responses WHERE upload_id = ?");
        $existing_stmt->execute([$fileId]);

        if ($existing_stmt->fetch()) {
            sendJsonResponse(['error' => 'Response already exists for this upload'], 409);
        }

        $pdo->beginTransaction();

        try {
            // Insert new response
            $insert = $pdo->prepare("
                INSERT INTO responses (upload_id, society_id, admin_user_id, response_type, venue_details, comments, response_date)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            ");
            $insert->execute([$fileId, $society_id, $adminId, $response_type, $venue_details, $comments]);

            // Update status in uploads table
            $update = $pdo->prepare("UPDATE uploads SET status = ? WHERE upload_id = ?");
            $update->execute([$response_type, $fileId]);

            $pdo->commit();
            sendJsonResponse(['success' => true, 'message' => 'Response submitted successfully']);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendJsonResponse(['error' => 'Transaction failed: ' . $e->getMessage()], 500);
        }
    }

    // File upload handler (for admin file submission)
    elseif (!empty($_FILES['file'])) {
        $allowed_types = ['pdf', 'docx', 'zip'];
        $file_name = $_FILES['file']['name'];
        $file_tmp = $_FILES['file']['tmp_name'];
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

        if (!in_array($file_ext, $allowed_types)) {
            sendJsonResponse(['error' => 'Invalid file type'], 400);
        }

        if ($_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            sendJsonResponse(['error' => 'File upload error'], 400);
        }

        $file_type = mime_content_type($file_tmp) ?: 'application/octet-stream';

        $upload_dir = __DIR__ . '/../uploads';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        if (!is_writable($upload_dir)) {
            sendJsonResponse(['error' => 'Upload directory not writable'], 500);
        }

        $new_file_name = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file_name);
        $destination = $upload_dir . '/' . $new_file_name;

        if (!move_uploaded_file($file_tmp, $destination)) {
            sendJsonResponse(['error' => 'Failed to move uploaded file'], 500);
        }

        $event_date = $_POST['event_date'] ?? null;

        $insert = $pdo->prepare("
            INSERT INTO uploads (file_name, file_path, file_type, uploaded_by, event_date, uploaded_at, status)
            VALUES (?, ?, ?, ?, ?, NOW(), 'pending')
        ");

        $insert->execute([
            $file_name,
            $destination,
            $file_type,
            $_SESSION['id'],
            $event_date
        ]);

        $upload_id = $pdo->lastInsertId();
        sendJsonResponse([
            'success' => true,
            'message' => 'File uploaded successfully',
            'upload_id' => $upload_id
        ]);
    }

    else {
        sendJsonResponse(['error' => 'No valid data received'], 400);
    }

} catch (Exception $e) {
    sendJsonResponse(['error' => 'Unexpected server error: ' . $e->getMessage()], 500);
}
