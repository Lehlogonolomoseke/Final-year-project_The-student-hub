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

error_log("Session data: " . print_r($_SESSION, true));

$pdo = getSupabaseConnection();

if (!isset($_SESSION['id']) || $_SESSION['role'] !== 'ADMIN') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit();
}

try {
    $admin_id = $_SESSION['id'];
    
    $debug_info = [
        'session_admin_id' => $admin_id,
        'session_role' => $_SESSION['role'],
        'admin_id_type' => gettype($admin_id)
    ];
    

    $society_stmt = $pdo->prepare("SELECT society_id, admin_user_id, name FROM societies WHERE admin_user_id = ?");
    $society_stmt->execute([$admin_id]);
    $society_result = $society_stmt->fetch();
    
    $debug_info['society_query_result'] = $society_result;
    
    if (!$society_result) {
        $society_stmt2 = $pdo->prepare("SELECT society_id, admin_user_id, name FROM societies WHERE CAST(admin_user_id AS TEXT) = CAST(? AS TEXT)");
        $society_stmt2->execute([$admin_id]);
        $society_result = $society_stmt2->fetch();
        $debug_info['string_comparison_result'] = $society_result;
    }
    
    if (!$society_result) {
        echo json_encode([
            'success' => false,
            'error' => 'No society found for this admin',
            'debug' => $debug_info
        ]);
        exit();
    }
    
    $society_id = $society_result['society_id'];
    
    // Query events for this society
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
            e.attendance_code,
            e.created_at,
            e.created_by
        FROM events e
        WHERE e.created_by IN (
            SELECT admin_user_id FROM societies WHERE society_id = ?
        )
        ORDER BY e.start_date DESC, e.start_time DESC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$society_id]);
    
    $adminEvents = [];
    while ($row = $stmt->fetch()) {
        $eventId = $row['event_id'];
        
        // Get RSVP counts
        $rsvpCount = ['interested' => 0, 'not_interested' => 0];
        try {
            $rsvpStmt = $pdo->prepare("
                SELECT status, COUNT(*) as count 
                FROM event_rsvps 
                WHERE event_id = ? 
                GROUP BY status
            ");
            $rsvpStmt->execute([$eventId]);
            
            while ($rsvp = $rsvpStmt->fetch()) {
                $status = strtolower(trim($rsvp['status']));
                if (in_array($status, ['interested', 'intrested', 'yes', '1'])) {
                    $rsvpCount['interested'] = intval($rsvp['count']);
                } elseif (in_array($status, ['not interested', 'not_interested', 'not intrested', 'no', '0'])) {
                    $rsvpCount['not_interested'] = intval($rsvp['count']);
                }
            }
        } catch (Exception $e) {
            // RSVP table might not exist, continue with zeros
            error_log("Error fetching RSVPs for event $eventId: " . $e->getMessage());
        }
        
        // Get attendance count
        $attendanceCount = 0;
        try {
            $attendanceStmt = $pdo->prepare("
                SELECT COUNT(*) as count 
                FROM event_attendance 
                WHERE event_id = ?
            ");
            $attendanceStmt->execute([$eventId]);
            $attendance = $attendanceStmt->fetch();
            $attendanceCount = intval($attendance['count'] ?? 0);
        } catch (Exception $e) {
            // Attendance table might not exist, continue with zero
            error_log("Error fetching attendance for event $eventId: " . $e->getMessage());
        }
        
        // Build event data
        $adminEvents[] = [
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
            'attendance_code' => $row['attendance_code'] ?? '',
            'created_at' => $row['created_at'],
            'created_by' => $row['created_by'],
            'rsvp_counts' => $rsvpCount,
            'attendance_count' => $attendanceCount
        ];
    }
    
    echo json_encode([
        'success' => true,
        'events' => $adminEvents,
        'total_events' => count($adminEvents),
        'society_id' => $society_id
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>