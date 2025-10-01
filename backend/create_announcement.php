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
require_once "notify_user.php";

// 1. Authentication and Authorization
if (!isset($_SESSION['id']) || !in_array($_SESSION['role'], ['ADMIN', 'DAYHOUSE'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit();
}

$creator_id = $_SESSION['id'];
$creator_role = $_SESSION['role'];

// 2. Input Validation
$input = json_decode(file_get_contents('php://input'), true);

$title = $input['title'] ?? '';
$content = $input['content'] ?? '';
$community_id = filter_var($input['community_id'] ?? 0, FILTER_VALIDATE_INT);
$community_type = $input['community_type'] ?? '';
$announcement_type = $input['announcement_type'] ?? 'General Info';
$is_pinned = filter_var($input['is_pinned'] ?? false, FILTER_VALIDATE_BOOLEAN);

$errors = [];
if (empty(trim($title)))
    $errors[] = "Title is required.";
if (empty(trim($content)))
    $errors[] = "Content is required.";
if (empty($community_id))
    $errors[] = "Community ID is required.";
if (!in_array($community_type, ['society', 'dayhouse']))
    $errors[] = "Invalid community type.";

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit();
}

try {
    $pdo = getSupabaseConnection();

    // 3. Security Check
    $is_authorized = false;
    if ($community_type === 'society' && $creator_role === 'ADMIN') {
        $stmt = $pdo->prepare("SELECT 1 FROM societies WHERE society_id = ? AND admin_user_id = ?");
        $stmt->execute([$community_id, $creator_id]);
        if ($stmt->fetch())
            $is_authorized = true;
    } elseif ($community_type === 'dayhouse' && $creator_role === 'DAYHOUSE') {
        $stmt = $pdo->prepare("SELECT 1 FROM dayhouses WHERE id = ? AND manager_id = ?");
        $stmt->execute([$community_id, $creator_id]);
        if ($stmt->fetch())
            $is_authorized = true;
    }

    if (!$is_authorized) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'You are not authorized to post announcements for this community.']);
        exit();
    }

    // 4. Insert Announcement
    $sql = "INSERT INTO announcements (title, content, created_by, society_id, dayhouse_id, announcement_type, is_pinned) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $society_id_to_insert = ($community_type === 'society') ? $community_id : null;
    $dayhouse_id_to_insert = ($community_type === 'dayhouse') ? $community_id : null;
    $is_pinned_for_db = $is_pinned ? 'true' : 'false';

    $stmt->execute([
        $title,
        $content,
        $creator_id,
        $society_id_to_insert,
        $dayhouse_id_to_insert,
        $announcement_type,
        $is_pinned_for_db
    ]);

    $announcement_id = $pdo->lastInsertId();

    // 5. Send Notifications
    if ($community_type === 'society') {
        $usersStmt = $pdo->prepare("SELECT id FROM users WHERE society_id = ?");
        $usersStmt->execute([$community_id]);
    } else {
        $usersStmt = $pdo->prepare("SELECT id FROM users WHERE dayhouse_id = ?");
        $usersStmt->execute([$community_id]);
    }
    $users = $usersStmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($users as $userId) {
        $message = "New {$announcement_type} in your {$community_type}: {$title}";
        notifyUser($userId, $message, "announcement");
    }

    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Announcement created successfully.',
        'announcement_id' => $announcement_id
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Announcement creation error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error occurred.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An unexpected error occurred.']);
}
?>