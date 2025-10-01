<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "db_supabase.php";

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit();
}

$user_id = $_SESSION['id'];

try {
    $pdo = getSupabaseConnection();

    // 1️⃣ Fetch notifications for the user
    $notifStmt = $pdo->prepare("
        SELECT 
            id,
            message,
            type,
            is_read,
            created_at,
            NULL AS title,
            NULL AS content,
            NULL AS announcement_type,
            NULL AS community_name,
            'notification' AS source
        FROM notifications
        WHERE user_id = ?
    ");
    $notifStmt->execute([$user_id]);
    $notifications = $notifStmt->fetchAll(PDO::FETCH_ASSOC);

    // 2️⃣ Fetch announcements for the user (using same logic as old announcement page)
    $annStmt = $pdo->prepare("
        SELECT
            a.announcement_id AS id,
            a.title,
            a.content,
            a.announcement_type,
            a.created_at,
            a.is_pinned,
            COALESCE(s.name, d.name) AS community_name,
            CASE WHEN r.announcement_id IS NOT NULL THEN true ELSE false END AS is_read,
            'announcement' AS source,
            NULL AS message,
            NULL AS type
        FROM announcements a
        LEFT JOIN societies s ON a.society_id = s.society_id
        LEFT JOIN dayhouses d ON a.dayhouse_id = d.id
        LEFT JOIN announcement_reads r ON a.announcement_id = r.announcement_id AND r.user_id = ?
        WHERE
            (a.society_id IN (SELECT society_id FROM society_members WHERE user_id = ? AND status = 'approved')
            OR a.dayhouse_id IN (SELECT dayhouse_id FROM student_dayhouse_participation WHERE user_id = ?))
        ORDER BY a.is_pinned DESC, a.created_at DESC
    ");
    $annStmt->execute([$user_id, $user_id, $user_id]);
    $announcements = $annStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3️⃣ Merge both arrays
    $combined = array_merge($notifications, $announcements);

    // 4️⃣ Sort by created_at descending
    usort($combined, function ($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });

    echo json_encode([
        'success' => true,
        'feed' => $combined
    ]);

} catch (PDOException $e) {
    error_log("Combined feed error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database error occurred.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An unexpected error occurred.']);
}
?>
