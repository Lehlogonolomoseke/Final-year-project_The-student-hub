<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once "db_supabase.php";

$pdo = getSupabaseConnection();

// Check if user is logged in
if (!isset($_SESSION['id'])) {
    echo json_encode(['success' => false, 'error' => 'User not logged in']);
    exit();
}

try {
    $user_id = $_SESSION['id'];
    
    // Get user's approved society memberships
    $membershipStmt = $pdo->prepare("
        SELECT society_id 
        FROM society_members 
        WHERE user_id = ? AND status = 'approved'
    ");
    $membershipStmt->execute([$user_id]);
    $memberships = $membershipStmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($memberships)) {
        echo json_encode([
            'success' => true,
            'events' => [],
            'message' => 'You are not a member of any society yet'
        ]);
        exit();
    }
    
    // Create placeholders for IN clause
    $placeholders = str_repeat('?,', count($memberships) - 1) . '?';
    
    // Query events from societies the user is a member of
    $sql = "
        SELECT 
            e.event_id,
            e.name,
            e.description,
            e.start_date,
            e.start_time,
            e.end_date,
            e.end_time,
            e.location,
            e.event_type,
            e.capacity,
            e.is_private,
            e.notices,
            e.created_at,
            s.name as society_name
        FROM events e
        INNER JOIN societies s ON e.created_by = s.admin_user_id
        WHERE s.society_id IN ($placeholders)
       AND (e.is_private = FALSE OR e.is_private IS NULL)
        AND e.start_date >= CURRENT_DATE
        ORDER BY e.start_date ASC, e.start_time ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($memberships);
    
    $memberEvents = [];
    while ($row = $stmt->fetch()) {
        $eventId = $row['event_id'];
        
        // Get user's RSVP status
        $rsvpStmt = $pdo->prepare("
            SELECT status 
            FROM event_rsvps 
            WHERE event_id = ? AND user_id = ?
        ");
        $rsvpStmt->execute([$eventId, $user_id]);
        $rsvpResult = $rsvpStmt->fetch();
        $userRsvpStatus = $rsvpResult ? $rsvpResult['status'] : null;
        
        // Check if user attended
        $attendanceStmt = $pdo->prepare("
            SELECT COUNT(*) as attended 
            FROM event_attendance 
            WHERE event_id = ? AND user_id = ?
        ");
        $attendanceStmt->execute([$eventId, $user_id]);
        $attendanceResult = $attendanceStmt->fetch();
        $userAttended = $attendanceResult['attended'] > 0;
        
        // Build event data
        $memberEvents[] = [
            'event_id' => $row['event_id'],
            'name' => $row['name'] ?? '',
            'description' => $row['description'] ?? '',
            'start_date' => $row['start_date'],
            'start_time' => $row['start_time'],
            'end_date' => $row['end_date'],
            'end_time' => $row['end_time'],
            'location' => $row['location'] ?? '',
            'event_type' => $row['event_type'] ?? 'General',
            'capacity' => $row['capacity'],
            'is_private' => $row['is_private'] ?? 0,
            'notices' => $row['notices'] ?? '',
            'created_at' => $row['created_at'],
            'society_name' => $row['society_name'],
            'user_rsvp_status' => $userRsvpStatus,
            'user_attended' => $userAttended
        ];
    }
    
    echo json_encode([
        'success' => true,
        'events' => $memberEvents,
        'total_events' => count($memberEvents),
        'memberships' => $memberships
    ]);

} catch (Exception $e) {
    error_log("Get Member Events Error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>