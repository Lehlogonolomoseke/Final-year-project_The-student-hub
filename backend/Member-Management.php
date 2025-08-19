<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

try {
   
    require_once "db_supabase.php";
    $pdo = getSupabaseConnection();
    
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $society_id = $_GET['society_id'] ?? null;
        
        // If no society_id is provided, fetch the current user's society ID
        if (!$society_id || $society_id === 'undefined' || $society_id === '') {

            if (!isset($_SESSION['id'])) {
                http_response_code(401);
                echo json_encode([
                    "success" => false, 
                    "error" => "User not logged in",
                    "debug" => [
                        "session_id" => session_id(),
                        "session_data" => $_SESSION,
                        "cookies" => $_COOKIE
                    ]
                ]);
                exit;
            }
            
            $user_id = $_SESSION['id'];
            
            // Get the society where this user is an admin
            $societyQuery = $pdo->prepare("SELECT society_id FROM societies WHERE admin_user_id = ?");
            $societyQuery->execute([$user_id]);
            $society = $societyQuery->fetch(PDO::FETCH_ASSOC);
            
            if (!$society) {
                http_response_code(404);
                echo json_encode(["success" => false, "error" => "No society found for this user"]);
                exit;
            }
            
            // Return the society ID
            http_response_code(200);
            echo json_encode([
                "success" => true, 
                "society_id" => $society['society_id']
            ]);
            exit;
        }
    
        error_log("Received society_id: " . var_export($society_id, true));

        $errors = [];

        $society_id = intval($society_id);
        
        if ($society_id <= 0) {
            $errors['society_id'] = "Invalid society ID format";
        }

        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(["success" => false, "errors" => $errors]);
            exit;
        }

        // First verify the society exists
        $societyCheck = $pdo->prepare("SELECT society_id FROM societies WHERE society_id = ?");
        $societyCheck->execute([$society_id]);
        
        if (!$societyCheck->fetch()) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Society not found"]);
            exit;
        }

        // Fetch members with user details
        $query = "
            SELECT 
                m.member_id, 
                m.status, 
                m.joined_at,
                u.id as user_id, 
                u.first_name, 
                u.last_name, 
                u.email
            FROM society_members m
            JOIN users u ON m.user_id = u.id
            WHERE m.society_id = ?
            ORDER BY m.joined_at DESC
        ";

        $stmt = $pdo->prepare($query);
        $stmt->execute([$society_id]);
        $members = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Log the number of members found
        error_log("Found " . count($members) . " members for society_id: " . $society_id);

        http_response_code(200);
        echo json_encode([
            "success" => true, 
            "members" => $members,
            "total_count" => count($members)
        ]);
        exit;
    }

    if ($method === 'POST') {
        // Approve or reject a member request
        $input = file_get_contents("php://input");
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid JSON input"]);
            exit;
        }
        
        $member_id = $data['member_id'] ?? null;
        $action = $data['action'] ?? null;

        $errors = [];

        if (empty($member_id)) {
            $errors['member_id'] = "Member ID is required";
        } elseif (!is_numeric($member_id) || intval($member_id) <= 0) {
            $errors['member_id'] = "Invalid member ID format";
        }

        if (empty($action)) {
            $errors['action'] = "Action is required";
        } elseif (!in_array($action, ['approve', 'reject'])) {
            $errors['action'] = "Invalid action. Must be 'approve' or 'reject'";
        }

        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(["success" => false, "errors" => $errors]);
            exit;
        }

        $member_id = intval($member_id);

        // check if member exists and get current status
        $checkStmt = $pdo->prepare("SELECT member_id, status FROM society_members WHERE member_id = ?");
        $checkStmt->execute([$member_id]);
        $existingMember = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if (!$existingMember) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Member not found"]);
            exit;
        }

        // Check if member is already processed
        if ($existingMember['status'] !== 'pending') {
            http_response_code(400);
            echo json_encode([
                "success" => false, 
                "error" => "Member request has already been processed",
                "current_status" => $existingMember['status']
            ]);
            exit;
        }

        $new_status = $action === 'approve' ? 'approved' : 'rejected';

        // Update member status
        $updateStmt = $pdo->prepare("UPDATE society_members SET status = ? WHERE member_id = ?");
        $success = $updateStmt->execute([$new_status, $member_id]);

        if ($success && $updateStmt->rowCount() > 0) {
            http_response_code(200);
            echo json_encode([
                "success" => true, 
                "message" => "Member status updated successfully",
                "member_id" => $member_id,
                "new_status" => $new_status
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Failed to update member status"]);
        }
        exit;
    }

    // Unsupported method
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Unsupported request method"]);

} catch (PDOException $e) {
    // Log database error
    error_log("Member Management Database Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "error" => "Database error occurred"
    ]);
    
} catch (Exception $e) {
    // Log general error
    error_log("Member Management Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "error" => "Internal server error"
    ]);
}

?>