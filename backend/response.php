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

    if (str_contains($contentType, 'application/json')) {
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            sendJsonResponse(['error' => 'Invalid JSON'], 400);
        }

        $venue_details = $input['venue_details'] ?? '';
        $comments = $input['comments'] ?? '';
        $fileId = $input['fileId'] ?? null;   // upload_id
        $response_type = $input['response_type'] ?? null;
        $adminId = $_SESSION['id'];

        if (!$fileId || !$response_type) {
            sendJsonResponse(['error' => 'Missing required fields: fileId or response_type'], 400);
        }

        // Get society ID from upload
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

            // 🔑 Return upload_id so Admin/SP can use it when creating event
            sendJsonResponse([
                'success' => true, 
                'message' => 'Response submitted successfully',
                'upload_id' => $fileId
            ]);

        } catch (Exception $e) {
            $pdo->rollBack();
            sendJsonResponse(['error' => 'Transaction failed: ' . $e->getMessage()], 500);
        }
    }

    else {
        sendJsonResponse(['error' => 'No valid data received'], 400);
    }

} catch (Exception $e) {
    sendJsonResponse(['error' => 'Unexpected server error: ' . $e->getMessage()], 500);
}
