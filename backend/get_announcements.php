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

// *** FIX 1: Authentication Check and User Info Retrieval ***
// Ensure that session variables are checked *before* trying to use them
if (!isset($_SESSION['id']) || !isset($_SESSION['role'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required.']);
    exit();
}

$user_id = $_SESSION['id'];
$user_role = $_SESSION['role'];

// Get user's community information
$user_community = null;
// *** FIX 2: Ensure $user_id is defined before using it in prepared statements ***
// The logic for fetching user community was outside the scope where $user_id was guaranteed to be set.
// It also needs to be fetched *after* authentication is confirmed.
require_once "db_supabase.php"; // Assuming db_supabase.php sets up $pdo correctly
try {
    $pdo = getSupabaseConnection();

    if ($user_role === 'ADMIN') {
        // Get the society this admin manages
        $stmt = $pdo->prepare("SELECT society_id as id, name, 'society' as type FROM societies WHERE admin_user_id = ?");
        $stmt->execute([$user_id]);
        $user_community = $stmt->fetch(PDO::FETCH_ASSOC);
    } elseif ($user_role === 'DAYHOUSE') {
        // Get the dayhouse this user manages
        $stmt = $pdo->prepare("SELECT id, name, 'dayhouse' as type FROM dayhouses WHERE manager_id = ?");
        $stmt->execute([$user_id]);
        $user_community = $stmt->fetch(PDO::FETCH_ASSOC);
    }
} catch (PDOException $e) {
    // Handle potential DB errors during community fetch
    error_log("Error fetching user community: " . $e->getMessage());
    // Decide if this should block fetching announcements or just result in null community
    // For now, we'll continue but log the error. If community is crucial, might return 500 here.
}


// 2. Get query parameters for filtering
$search_term = $_GET['search'] ?? '';
$announcement_type_filter = $_GET['type'] ?? '';
$community_id_filter = filter_var($_GET['community_id'] ?? '', FILTER_VALIDATE_INT); // This is not used in the current query logic

try {
    // Re-establish connection if it was closed or if db_supabase.php is only included once
    if (!isset($pdo) || $pdo === null) {
        $pdo = getSupabaseConnection();
    }

    // 3. Build SQL Query
    $params = [$user_id, $user_id, $user_id]; // For announcement_reads and membership checks
    $sql = "
        SELECT
            a.announcement_id,
            a.title,
            a.content,
            a.created_at,
            a.announcement_type,
            a.is_pinned,
            COALESCE(s.name, d.name) as community_name,
            CASE WHEN r.announcement_id IS NOT NULL THEN true ELSE false END as is_read
        FROM announcements a
        LEFT JOIN societies s ON a.society_id = s.society_id
        LEFT JOIN dayhouses d ON a.dayhouse_id = d.id
        LEFT JOIN announcement_reads r ON a.announcement_id = r.announcement_id AND r.user_id = ?
        WHERE
            (a.society_id IN (SELECT society_id FROM society_members WHERE user_id = ? AND status = 'approved')
            OR a.dayhouse_id IN (SELECT dayhouse_id FROM student_dayhouse_participation WHERE user_id = ?))
    ";

    if (!empty($search_term)) {
        $sql .= " AND (a.title ILIKE ? OR a.content ILIKE ?)";
        $params[] = '%' . $search_term . '%';
        $params[] = '%' . $search_term . '%';
    }

    if (!empty($announcement_type_filter)) {
        $sql .= " AND a.announcement_type = ?";
        $params[] = $announcement_type_filter;
    }

    // Note: $community_id_filter is present but not actively used in the WHERE clause.
    // If you intend to filter by a specific community ID, you'd need to add logic here,
    // potentially requiring a 'community_type' parameter as well, or a more complex JOIN.

    $sql .= " ORDER BY a.is_pinned DESC, a.created_at DESC";

    // 4. Execute and Fetch
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'announcements' => $announcements,
        'user' => [
            'id' => $user_id,
            'role' => $user_role,
            'community' => $user_community // This will be null if the user doesn't manage a community or if there was an error fetching it.
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Get announcements error: " . $e->getMessage());
    echo json_encode(['success' => false, 'error' => 'Database error occurred.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An unexpected error occurred.']);
}
?>