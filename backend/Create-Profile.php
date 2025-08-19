<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Check if user is logged in
    if (!isset($_SESSION['id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'User not logged in']);
        exit;
    }
    
    error_log("User ID from session: " . $_SESSION['id']);
    $admin_user_id = $_SESSION['id'];

    // Validate required fields
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $category = trim($_POST['category'] ?? '');

    error_log("Received data - Name: $name, Description: $description, Category: $category");

    $errors = [];

    if (empty($name)) {
        $errors['name'] = "Society name is required";
    }

    if (empty($description)) {
        $errors['description'] = "Description is required";
    }

    if (empty($category)) {
        $errors['category'] = "Category is required";
    }

    // Image is required
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== 0) {
        $errors['image'] = "Society logo is required";
        error_log("Image upload error: " . ($_FILES['image']['error'] ?? 'No file uploaded'));
    }

    if (!empty($errors)) {
        error_log("Validation errors: " . json_encode($errors));
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }

    // Database operations
    require_once "db_supabase.php";
    $pdo = getSupabaseConnection();
    
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }
    
    // Find the society that this admin user created
    $societyStmt = $pdo->prepare("SELECT society_id, name, logo_url FROM societies WHERE admin_user_id = ?");
    $societyStmt->execute([$admin_user_id]);
    $existingSociety = $societyStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existingSociety) {
        error_log("No society found for user ID: $admin_user_id");
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'No society found for this user. Please create a society first.']);
        exit;
    }
    
    error_log("Found existing society: " . json_encode($existingSociety));
    $societyId = $existingSociety['society_id'];
    
    // Handle file upload
    $image = $_FILES['image'];
    $uploadDir = __DIR__ . '/uploads/society_logos/';
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    $ext = pathinfo($image['name'], PATHINFO_EXTENSION);
    $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (!in_array(strtolower($ext), $allowedExts)) {
        error_log("Invalid image format: $ext");
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => ['image' => 'Invalid image format. Allowed: jpg, jpeg, png, gif, webp']]);
        exit;
    }
    
    // Check file size (max 5MB)
    if ($image['size'] > 5 * 1024 * 1024) {
        error_log("Image too large: " . $image['size'] . " bytes");
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => ['image' => 'Image size must be less than 5MB']]);
        exit;
    }
    
    $newFileName = uniqid('soc_', true) . '.' . $ext;
    $destination = $uploadDir . $newFileName;
    $newImagePath = 'uploads/society_logos/' . $newFileName;
    
    if (!move_uploaded_file($image['tmp_name'], $destination)) {
        error_log("Failed to move uploaded file to: $destination");
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to save image']);
        exit;
    }
    
    error_log("Image uploaded successfully to: $destination");
    
    // Store old image path for cleanup
    $oldImagePath = null;
    if (!empty($existingSociety['logo_url'])) {
        $oldImagePath = __DIR__ . '/' . $existingSociety['logo_url'];
    }
    
    // Check if the name is being changed to something that already exists for another society
    if (strtolower($existingSociety['name']) !== strtolower($name)) {
        $nameCheckStmt = $pdo->prepare("SELECT society_id FROM societies WHERE name = ? AND society_id != ?");
        $nameCheckStmt->execute([$name, $societyId]);
        $nameConflict = $nameCheckStmt->fetch();
        
        if ($nameConflict) {
            // Clean up uploaded image
            if (file_exists($destination)) {
                unlink($destination);
            }
            http_response_code(400);
            echo json_encode(['success' => false, 'errors' => ['name' => 'Society name already exists for another society']]);
            exit;
        }
    }
    
    // Update the existing society with the correct column order
    $updateStmt = $pdo->prepare("
        UPDATE societies 
        SET name = ?, description = ?, logo_url = ?, category = ?, created_at = NOW() 
        WHERE society_id = ? AND admin_user_id = ?
    ");
    
    $result = $updateStmt->execute([$name, $description, $newImagePath, $category, $societyId, $admin_user_id]);
    
    error_log("Update query executed. Result: " . ($result ? 'true' : 'false') . ", Rows affected: " . $updateStmt->rowCount());
    
    if ($result && $updateStmt->rowCount() > 0) {
        // Delete old image file if it exists
        if ($oldImagePath && file_exists($oldImagePath)) {
            unlink($oldImagePath);
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true, 
            'message' => 'Society profile updated successfully',
            'society' => [
                'society_id' => $societyId,
                'name' => $name,
                'description' => $description,
                'category' => $category,
                'logo_url' => $newImagePath,
                'admin_user_id' => $admin_user_id
            ]
        ]);
    } else {
        // Clean up uploaded image if update failed
        if (file_exists($destination)) {
            unlink($destination);
        }
        error_log("Failed to update society profile");
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to update society profile']);
    }
    
} catch (Exception $e) {
    // Clean up uploaded image on any error
    if (isset($destination) && file_exists($destination)) {
        unlink($destination);
    }
    
    error_log("Society profile update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error occurred: ' . $e->getMessage()]);
}

?>