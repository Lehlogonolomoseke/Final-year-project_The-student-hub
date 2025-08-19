<?php
session_start();
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:3000");
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function sendJsonResponse($data, $httpCode = 200) {
    http_response_code($httpCode);
    echo json_encode($data);
    exit();
}

try {
    // This assumes you have a db_supabase.php file that provides the PDO connection
    $dbPath = 'db_supabase.php';
    if (!file_exists($dbPath)) {
        throw new Exception('Database connection file not found: ' . $dbPath);
    }
    require_once $dbPath;
    $pdo = getSupabaseConnection();

    if (!$pdo) {
        throw new Exception('Database connection failed');
    }

    // =========================
    // GET request - fetch dayhouses or dayhouse members
    // =========================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? null;

        if ($action === 'get_dayhouse') {
            $dayhouse_id = $_GET['dayhouse_id'] ?? null;
            if (!$dayhouse_id || $dayhouse_id === 'undefined' || !is_numeric($dayhouse_id)) {
                sendJsonResponse(["success" => false, "error" => "No valid dayhouse ID provided"], 400);
            }

            $query = "SELECT id, name, description, image FROM dayhouses WHERE id = :id";
            $stmt = $pdo->prepare($query);
            $stmt->execute([':id' => $dayhouse_id]);
            $dayhouse = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($dayhouse) {
                // Fetch sports associated with the dayhouse
                $sportsStmt = $pdo->prepare("
                    SELECT s.name 
                    FROM dayhouse_sports ds
                    JOIN sports s ON s.sports_id = ds.sp_id
                    WHERE ds.dayhouse_id = :dayhouse_id
                ");
                $sportsStmt->execute([':dayhouse_id' => $dayhouse_id]);
                $sports = array_column($sportsStmt->fetchAll(PDO::FETCH_ASSOC), 'name');
                $dayhouse['sports'] = $sports;

                sendJsonResponse(['success' => true, 'dayhouse' => $dayhouse]);
            } else {
                sendJsonResponse(['success' => false, 'error' => 'Dayhouse not found'], 404);
            }
        }
        
        else if ($action === 'get_members') {
            $dayhouse_id = $_GET['dayhouse_id'] ?? null;
            if (!$dayhouse_id || $dayhouse_id === 'undefined' || !is_numeric($dayhouse_id)) {
                sendJsonResponse(["success" => false, "error" => "No valid dayhouse ID provided"], 400);
            }

            $query = "
                SELECT 
                    sdp.id,
                    sdp.user_id,
                    sdp.dayhouse_id,
                    sdp.fee_paid,
                    sdp.joined_at,
                    u.First_Name as first_name,
                    u.last_Name as last_name,
                    u.Email as email
                FROM student_dayhouse_participation sdp
                JOIN users u ON sdp.user_id = u.id
                WHERE sdp.dayhouse_id = :dayhouse_id
                ORDER BY sdp.joined_at DESC";

            $stmt = $pdo->prepare($query);
            $stmt->execute([':dayhouse_id' => $dayhouse_id]);
            $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Cast fee_paid to integer for each member
            foreach ($members as &$member) {
                $member['fee_paid'] = (int)$member['fee_paid'];
            }

            sendJsonResponse(["success" => true, "members" => $members]);
        }

        else {
            sendJsonResponse(["success" => false, "error" => "Invalid action"], 400);
        }
    }

    // =========================
    // POST request - update payment status
    // =========================
    else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendJsonResponse(["success" => false, "message" => "Invalid JSON input"], 400);
        }

        $member_id = $input['member_id'] ?? null;
        $fee_paid = $input['fee_paid'] ?? null;

        if (!$member_id || !isset($fee_paid)) {
            sendJsonResponse(["success" => false, "message" => "Missing member_id or fee_paid"], 400);
        }

        $stmt = $pdo->prepare("UPDATE student_dayhouse_participation SET fee_paid = :fee_paid WHERE id = :member_id");
        $success = $stmt->execute([
            ':fee_paid' => $fee_paid,
            ':member_id' => $member_id
        ]);

        if ($success) {
            sendJsonResponse(["success" => true, "message" => "Payment status updated successfully"]);
        } else {
            sendJsonResponse(["success" => false, "message" => "Failed to update payment status"], 500);
        }
    }

    // =========================
    // Invalid method
    // =========================
    else {
        sendJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
    }

} catch (Exception $e) {
    error_log("Dayhouse Management Error: " . $e->getMessage());
    sendJsonResponse([
        "success" => false,
        "error" => "Internal server error",
        "message" => $e->getMessage()
    ], 500);
}
?>