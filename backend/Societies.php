<?php
session_start();

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // our database connection
    require_once 'db_supabase.php';
    $pdo = getSupabaseConnection();
    
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get JSON input
        $rawData = file_get_contents("php://input");
        $input = json_decode($rawData, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
            exit();
        }

        // Validate required fields
        if (empty($input['name']) || empty($input['email']) || empty($input['password'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Name, email, and password are required']);
            exit();
        }

        $name = trim($input['name']);
        $email = trim($input['email']);
        $password = trim($input['password']);

        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid email format']);
            exit();
        }

        // Start transaction
        $pdo->beginTransaction();

        try {
            // Check if the email exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            $result = $stmt->fetch();

            if ($result) {
                throw new Exception('Email already exists');
            }

       
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            
            $stmt = $pdo->prepare("
                INSERT INTO users (first_name, last_name, email, password, role, change_password) 
                VALUES (?, NULL, ?, ?, 'ADMIN', TRUE)
            ");

            $stmt->execute([$name, $email, $hashedPassword]);
            
            // Get the new user ID using lastInsertId()
            $societyUserId = $pdo->lastInsertId();
            
            if (!$societyUserId) {
                throw new Exception('Failed to create user - no ID returned');
            }

            // Create the society - FIXED: Remove the fetch() call and use lastInsertId()
            $stmt = $pdo->prepare("
                INSERT INTO societies (name, description, admin_user_id, created_at) 
                VALUES (?, NULL, ?, NOW())
            ");

            $stmt->execute([$name, $societyUserId]);
            
            // Get the new society ID using lastInsertId()
            $societyId = $pdo->lastInsertId();
            
            if (!$societyId) {
                throw new Exception('Failed to create society - no ID returned');
            }

            // Commit transaction
            $pdo->commit();

            // Log success for debugging
            error_log("Society created successfully. User ID: $societyUserId, Society ID: $societyId");

            echo json_encode([
                'success' => true,
                'message' => 'Society created successfully',
                'society_id' => $societyId,
                'user_id' => $societyUserId
            ]);

        } catch (Exception $e) {
            // Rollback transaction
            $pdo->rollback();
            
            // Log the error
            error_log("Society creation failed: " . $e->getMessage());

            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    // Log database error
    error_log("Society Creation Database Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "error" => "Database error occurred"
    ]);
    
} catch (Exception $e) {
    // Log general error
    error_log("Society Creation Error: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "error" => "Internal server error"
    ]);
}
?>