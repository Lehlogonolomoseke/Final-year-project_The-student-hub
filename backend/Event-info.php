<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Must be logged in
if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit();
}

$userId = $_SESSION['id'];

// Get JSON body and log it for debugging
$input = json_decode(file_get_contents('php://input'), true);
error_log("Received payload: " . json_encode($input));

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
    exit();
}

// Extract values
$uploadId = $input['upload_id'] ?? null;
$preferredVenue = $input['preferred_venue'] ?? null;
$alternativeVenue1 = $input['alternative_venue_1'] ?? null;
$alternativeVenue2 = $input['alternative_venue_2'] ?? null;
$bookingDate = $input['booking_date'] ?? null;
$startTime = $input['start_time'] ?? null;
$endTime = $input['end_time'] ?? null;
$specialRequirements = $input['special_requirements'] ?? null;
$furnitureRequired = $input['furniture_required'] ?? false;
$furnitureTypes = $input['furniture_types'] ?? [];
$otherFurnitureDetails = $input['other_furniture_details'] ?? null;
$acknowledgeRules = $input['acknowledge_rules'] ?? false;
$costItems = $input['cost_items'] ?? [];

// Log extracted values
error_log("Upload ID: " . $uploadId);
error_log("Cost items count: " . count($costItems));
error_log("Cost items: " . json_encode($costItems));

// Check all required fields
if (!$uploadId || !$preferredVenue || !$bookingDate || !$startTime || !$endTime) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Missing required fields',
        'debug' => [
            'upload_id' => $uploadId,
            'preferred_venue' => $preferredVenue,
            'booking_date' => $bookingDate,
            'start_time' => $startTime,
            'end_time' => $endTime
        ]
    ]);
    exit();
}

try {
    require_once('db_supabase.php');
    $pdo = getSupabaseConnection();

    $pdo->beginTransaction();

    // Verify upload exists and belongs to user
    $uploadCheckSql = "SELECT upload_id, uploaded_by FROM uploads WHERE upload_id = ? AND uploaded_by = ?";
    $uploadCheckStmt = $pdo->prepare($uploadCheckSql);
    $uploadCheckStmt->execute([$uploadId, $userId]);
    $uploadCheck = $uploadCheckStmt->fetch(PDO::FETCH_ASSOC);

    if (!$uploadCheck) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Upload not found or unauthorized']);
        exit();
    }

    error_log("Upload verification successful");

    // Prepare JSON data
    $furnitureTypesJson = json_encode($furnitureTypes);
    error_log("Furniture types JSON: " . $furnitureTypesJson);

    // Insert venue booking request
    try {
        $venueBookingSql = "INSERT INTO venue_booking_requests 
                            (prefered_venue, alternative_venue_1, alternative_venue_2, booking_date, 
                             start_time, end_time, special_requirements, furniture_required, furniture_types, 
                             other_furniture_details, acknowledge_rules, status, created_at, updated_at, upload_id) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW(), ?)";
        
        $venueBookingStmt = $pdo->prepare($venueBookingSql);
        
        $venueParams = [
            $preferredVenue,
            $alternativeVenue1,
            $alternativeVenue2,
            $bookingDate,
            $startTime,
            $endTime,
            $specialRequirements,
            $furnitureRequired ? 1 : 0,
            $furnitureTypesJson,
            $otherFurnitureDetails,
            $acknowledgeRules ? 1 : 0,
            $uploadId
        ];
        
        error_log("Venue booking params: " . json_encode($venueParams));
        
        $venueBookingResult = $venueBookingStmt->execute($venueParams);

        if (!$venueBookingResult) {
            $errorInfo = $venueBookingStmt->errorInfo();
            error_log("Venue booking insert failed: " . json_encode($errorInfo));
            throw new Exception("Failed to insert venue booking request: " . $errorInfo[2]);
        }

        error_log("Venue booking inserted successfully");
        $venueBookingId = $pdo->lastInsertId();
        error_log("Venue booking ID: " . $venueBookingId);

    } catch (Exception $e) {
        error_log("Venue booking error: " . $e->getMessage());
        throw new Exception("Venue booking failed: " . $e->getMessage());
    }

    // Insert cost items
    $totalBudget = 0;
    $insertedCostItems = 0;
    
    if (!empty($costItems)) {
        try {
            // Column order: id, name, created_at, budget, comments, upload_id
            $costItemSql = "INSERT INTO event_costs (name, created_at, budget, comments, upload_id) VALUES (?, NOW(), ?, ?, ?)";
            $costItemStmt = $pdo->prepare($costItemSql);

            foreach ($costItems as $index => $item) {
                if (!empty($item['name']) && isset($item['budget']) && $item['budget'] !== '') {
                    $budget = floatval($item['budget']);
                    $totalBudget += $budget;

                    $costParams = [
                        trim($item['name']),
                        $budget,
                        !empty($item['comments']) ? trim($item['comments']) : null,
                        $uploadId
                    ];

                    error_log("Cost item {$index} params: " . json_encode($costParams));

                    $costItemResult = $costItemStmt->execute($costParams);

                    if ($costItemResult) {
                        $insertedCostItems++;
                        error_log("Cost item {$index} inserted successfully");
                    } else {
                        $errorInfo = $costItemStmt->errorInfo();
                        error_log("Cost item {$index} insert failed: " . json_encode($errorInfo));
                    }
                }
            }
        } catch (Exception $e) {
            error_log("Cost items error: " . $e->getMessage());
            throw new Exception("Cost items failed: " . $e->getMessage());
        }
    }

    // Update upload status
    try {
        $updateUploadSql = "UPDATE uploads SET status = 'pending' WHERE upload_id = ?";
        $updateUploadStmt = $pdo->prepare($updateUploadSql);
        $updateResult = $updateUploadStmt->execute([$uploadId]);

        if (!$updateResult) {
            $errorInfo = $updateUploadStmt->errorInfo();
            error_log("Upload update failed: " . json_encode($errorInfo));
            throw new Exception("Failed to update upload status: " . $errorInfo[2]);
        }

        error_log("Upload status updated successfully");
    } catch (Exception $e) {
        error_log("Upload update error: " . $e->getMessage());
        throw new Exception("Upload update failed: " . $e->getMessage());
    }

    $pdo->commit();
    error_log("Transaction committed successfully");

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Event submission completed successfully',
        'data' => [
            'upload_id' => $uploadId,
            'venue_booking_id' => $venueBookingId,
            'total_budget' => $totalBudget,
            'status' => 'pending',
            'cost_items_submitted' => count($costItems),
            'cost_items_inserted' => $insertedCostItems
        ]
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    error_log("Submission error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Submission failed: ' . $e->getMessage(),
        'debug_info' => [
            'upload_id' => $uploadId,
            'cost_items_count' => count($costItems ?? []),
            'total_budget' => $totalBudget ?? 0
        ]
    ]);
}
?>