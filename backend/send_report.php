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

// Check if user is logged in and is admin
if (!isset($_SESSION['id']) || $_SESSION['role'] !== 'ADMIN') {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Admin authentication required']);
    exit();
}

try {
    require_once('db_supabase.php');
    $pdo = getSupabaseConnection();

    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        exit();
    }

    $eventName = $input['event_name'] ?? null;
    $eventDate = $input['event_date'] ?? null;
    $pdfData = $input['pdf_data'] ?? null; // Base64 encoded PDF
    $message = $input['message'] ?? '';

    if (!$eventName || !$eventDate || !$pdfData) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields: event_name, event_date, pdf_data']);
        exit();
    }

    // Save PDF file
    $uploadDir = './sent_reports';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $timestamp = time();
    $cleanName = preg_replace('/[^a-zA-Z0-9.-]/', '_', $eventName);
    $fileName = $timestamp . '_' . $cleanName . '_Report.pdf';
    $filePath = $uploadDir . '/' . $fileName;

    // Decode and save PDF
    $pdfContent = base64_decode($pdfData);
    if (!file_put_contents($filePath, $pdfContent)) {
        throw new Exception('Failed to save PDF file');
    }

    // Insert record into database - Send to student practitioner (assuming role = 'student')
    $sql = "INSERT INTO sent_reports (
                event_name,
                event_date,
                pdf_file_path,
                admin_message,
                sent_by,
                status,
                sent_at
            ) VALUES (?, ?, ?, ?, ?, 'sent', NOW())
            RETURNING report_id, sent_at";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $eventName,
        $eventDate,
        'sent_reports/' . $fileName,
        $message,
        $_SESSION['id']
    ]);

    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        throw new Exception('Failed to send report');
    }

    echo json_encode([
        'success' => true,
        'message' => 'Report sent successfully to student practitioner',
        'report_id' => $result['report_id'],
        'sent_at' => $result['sent_at']
    ]);

} catch (Exception $e) {
    // Clean up file if database insert failed
    if (isset($filePath) && file_exists($filePath)) {
        unlink($filePath);
    }
    error_log("Send report error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to send report: ' . $e->getMessage()]);
}
?>