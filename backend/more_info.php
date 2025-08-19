<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit();
}

// Must be logged in (optional - remove if not needed)
if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Authentication required']);
    exit();
}

try {
    require_once('db_supabase.php');
    $pdo = getSupabaseConnection();
} catch (Exception $e) {
    error_log('Database connection error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit();
}

// Get upload_id from query parameter
$uploadId = $_GET['upload_id'] ?? null;

if (!$uploadId || !is_numeric($uploadId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid or missing upload_id']);
    exit();
}

error_log("Fetching info for upload_id: " . $uploadId);

try {
    // First, get upload information to verify it exists
    // FIXED: Changed created_at to uploaded_at to match your schema
    $uploadSql = "SELECT upload_id, uploaded_by, status, uploaded_at FROM uploads WHERE upload_id = ?";
    $uploadStmt = $pdo->prepare($uploadSql);
    $uploadStmt->execute([$uploadId]);
    $uploadInfo = $uploadStmt->fetch(PDO::FETCH_ASSOC);

    if (!$uploadInfo) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Upload not found']);
        exit();
    }

    error_log("Upload found: " . json_encode($uploadInfo));

    // Query to get event costs
    $costsSql = "SELECT id, name, created_at, budget, comments, upload_id FROM event_costs WHERE upload_id = ?";
    $costsStmt = $pdo->prepare($costsSql);
    $costsStmt->execute([$uploadId]);
    $eventCosts = $costsStmt->fetchAll(PDO::FETCH_ASSOC);

    error_log("Event costs found: " . count($eventCosts));

    // Query to get venue booking details
    $venueSql = "SELECT id, prefered_venue, alternative_venue_1, alternative_venue_2, booking_date, 
                        start_time, end_time, special_requirements, furniture_required, furniture_types, 
                        other_furniture_details, acknowledge_rules, status, created_at, updated_at, upload_id
                 FROM venue_booking_requests WHERE upload_id = ?";
    $venueStmt = $pdo->prepare($venueSql);
    $venueStmt->execute([$uploadId]);
    $venueBooking = $venueStmt->fetch(PDO::FETCH_ASSOC);

    error_log("Venue booking found: " . ($venueBooking ? 'Yes' : 'No'));

    // Calculate total budget from cost items
    $totalBudget = 0;
    foreach ($eventCosts as $cost) {
        $totalBudget += floatval($cost['budget'] ?? 0);
    }

    // Prepare response data
    $eventData = [
        'success' => true,
        'upload_info' => [
            'upload_id' => $uploadInfo['upload_id'],
            'uploaded_by' => $uploadInfo['uploaded_by'],
            'status' => $uploadInfo['status'],
            // FIXED: Use uploaded_at instead of created_at
            'created_at' => $uploadInfo['uploaded_at']  // Mapping uploaded_at to created_at for frontend compatibility
        ],
        'event_costs' => [
            'total_budget' => $totalBudget,
            'cost_items' => $eventCosts,
            'items_count' => count($eventCosts)
        ],
        'venue_booking' => $venueBooking ? [
            'id' => $venueBooking['id'],
            'prefered_venue' => $venueBooking['prefered_venue'],
            'alternative_venue_1' => $venueBooking['alternative_venue_1'],
            'alternative_venue_2' => $venueBooking['alternative_venue_2'],
            'booking_date' => $venueBooking['booking_date'],
            'start_time' => $venueBooking['start_time'],
            'end_time' => $venueBooking['end_time'],
            'special_requirements' => $venueBooking['special_requirements'],
            'furniture_required' => (bool)$venueBooking['furniture_required'],
            'furniture_types' => $venueBooking['furniture_types'] ? json_decode($venueBooking['furniture_types'], true) : [],
            'other_furniture_details' => $venueBooking['other_furniture_details'],
            'acknowledge_rules' => (bool)$venueBooking['acknowledge_rules'],
            'status' => $venueBooking['status'],
            'created_at' => $venueBooking['created_at'],
            'updated_at' => $venueBooking['updated_at'],
            'upload_id' => $venueBooking['upload_id']
        ] : null
    ];
    
    echo json_encode($eventData);
    
} catch (PDOException $e) {
    error_log('PDO Error: ' . $e->getMessage() . ' | Code: ' . $e->getCode());
    error_log('Upload ID: ' . $uploadId);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database query failed: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log('General error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>