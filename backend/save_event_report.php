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

if (!isset($_SESSION['id']) || $_SESSION['role'] !== 'ADMIN') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit();
}

$required_fields = ['event_id', 'general_feedback'];
foreach ($required_fields as $field) {
    if (!isset($input[$field])) {
        echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
        exit();
    }
}

$event_id = $input['event_id'];
$general_feedback = trim($input['general_feedback']);
$actual_spending = $input['actual_spending'] ?? []; // Array of cost_id => amount
$report_date = $input['report_date'] ?? date('Y-m-d');
$admin_id = $_SESSION['id'];

try {

    $pdo->beginTransaction();

    $event_info_stmt = $pdo->prepare("
        SELECT 
            e.*,
            s.name as society_name,
            -- RSVP counts
            COALESCE(rsvp_interested.count, 0) as rsvp_interested_count,
            COALESCE(rsvp_not_interested.count, 0) as rsvp_not_interested_count,
            -- Attendance count
            COALESCE(attendance.count, 0) as attendance_count
        FROM events e
        LEFT JOIN societies s ON s.admin_user_id = e.created_by
        LEFT JOIN (
            SELECT event_id, COUNT(*) as count 
            FROM event_rsvps 
            WHERE LOWER(TRIM(status)) IN ('interested', 'intrested', 'yes', '1')
            GROUP BY event_id
        ) rsvp_interested ON e.event_id = rsvp_interested.event_id
        LEFT JOIN (
            SELECT event_id, COUNT(*) as count 
            FROM event_rsvps 
            WHERE LOWER(TRIM(status)) IN ('not interested', 'not_interested', 'not intrested', 'no', '0')
            GROUP BY event_id
        ) rsvp_not_interested ON e.event_id = rsvp_not_interested.event_id
        LEFT JOIN (
            SELECT event_id, COUNT(*) as count 
            FROM event_attendance
            GROUP BY event_id
        ) attendance ON e.event_id = attendance.event_id
        WHERE e.event_id = ? AND e.created_by = ?
    ");
    $event_info_stmt->execute([$event_id, $admin_id]);
    $event_info = $event_info_stmt->fetch();

    if (!$event_info) {
        throw new Exception('Event not found or access denied');
    }

    // ✅ Calculate financial totals if there are costs
    $total_budgeted = 0;
    $total_actual = 0;
    $cost_details = [];

    if ($event_info['upload_id']) {
        // Get event costs
        $costs_stmt = $pdo->prepare("
            SELECT id, name, budget, comments
            FROM event_costs
            WHERE upload_id = ?
        ");
        $costs_stmt->execute([$event_info['upload_id']]);
        $costs = $costs_stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($costs as $cost) {
            $cost_id = $cost['id'];
            $budgeted = floatval($cost['budget']);
            $actual = floatval($actual_spending[$cost_id] ?? 0);

            $total_budgeted += $budgeted;
            $total_actual += $actual;

            $cost_details[] = [
                'cost_id' => $cost_id,
                'name' => $cost['name'],
                'budget' => $budgeted,
                'actual' => $actual,
                'difference' => $budgeted - $actual,
                'comments' => $cost['comments']
            ];
        }
    }

    $savings = $total_budgeted - $total_actual;

    // ✅ Prepare comprehensive report data
    $report_data = [
        'event_info' => [
            'event_id' => $event_info['event_id'],
            'name' => $event_info['name'],
            'description' => $event_info['description'],
            'start_date' => $event_info['start_date'],
            'start_time' => $event_info['start_time'],
            'end_date' => $event_info['end_date'],
            'end_time' => $event_info['end_time'],
            'location' => $event_info['location'],
            'event_type' => $event_info['event_type'],
            'capacity' => $event_info['capacity'],
            'society_name' => $event_info['society_name']
        ],
        'participation_summary' => [
            'rsvp_interested' => intval($event_info['rsvp_interested_count']),
            'rsvp_not_interested' => intval($event_info['rsvp_not_interested_count']),
            'total_rsvp' => intval($event_info['rsvp_interested_count']) + intval($event_info['rsvp_not_interested_count']),
            'attendance_count' => intval($event_info['attendance_count']),
            'attendance_rate' => $event_info['capacity'] ? 
                (intval($event_info['attendance_count']) / intval($event_info['capacity'])) * 100 : null
        ],
        'financial_summary' => [
            'total_budgeted' => $total_budgeted,
            'total_actual' => $total_actual,
            'savings' => $savings,
            'cost_breakdown' => $cost_details,
            'has_financial_data' => !empty($cost_details)
        ]
    ];

    // ✅ Check if a report already exists for this event
    $existing_report_stmt = $pdo->prepare("
        SELECT report_id FROM event_reports WHERE event_id = ?
    ");
    $existing_report_stmt->execute([$event_id]);
    $existing_report = $existing_report_stmt->fetch();

    if ($existing_report) {
        // Update existing report
        $update_report_stmt = $pdo->prepare("
            UPDATE event_reports
            SET general_feedback = ?, 
                report_date = ?, 
                total_budgeted = ?, 
                total_actual = ?,
                report_data = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE event_id = ?
        ");
        $update_report_stmt->execute([
            $general_feedback,
            $report_date,
            $total_budgeted,
            $total_actual,
            json_encode($report_data),
            $event_id
        ]);
        $report_id = $existing_report['report_id'];
        $action = 'updated';
    } else {
        // Insert new report
        $insert_report_stmt = $pdo->prepare("
            INSERT INTO event_reports (
                event_id, 
                general_feedback, 
                report_date, 
                created_by, 
                total_budgeted, 
                total_actual,
                report_data,
                created_at, 
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING report_id
        ");
        $insert_report_stmt->execute([
            $event_id,
            $general_feedback,
            $report_date,
            $admin_id,
            $total_budgeted,
            $total_actual,
            json_encode($report_data)
        ]);
        $report_result = $insert_report_stmt->fetch();
        $report_id = $report_result['report_id'];
        $action = 'created';
    }

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'message' => "Event report {$action} successfully",
        'report_id' => $report_id,
        'action' => $action,
        'financial_summary' => $report_data['financial_summary'],
        'participation_summary' => $report_data['participation_summary'],
        'event_info' => $report_data['event_info']
    ]);

} catch (Exception $e) {
    $pdo->rollback();
    error_log("Error saving event report: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'error' => 'Failed to save report: ' . $e->getMessage()
    ]);
}
?>