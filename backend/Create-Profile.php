<?php

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

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

// Validate required fields
$name = trim($_POST['name'] ?? '');
$description = trim($_POST['description'] ?? '');
$category = trim($_POST['category'] ?? '');
$admin_user_id = intval($_POST['admin_user_id'] ?? 0);
$society_id = intval($_POST['society_id'] ?? 0); // Optional: for explicit updates

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

if (empty($admin_user_id)) {
    $errors['admin_user_id'] = "Admin user ID is required";
}

if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['errors' => $errors]);
    exit;
}

try {
    // Database operations
    require_once "db_supabase.php";
    $pdo = getSupabaseConnection();
    
    // Verify admin user exists
    $userStmt = $pdo->prepare("SELECT id FROM users WHERE id = ?");
    $userStmt->execute([$admin_user_id]);
    $userExists = $userStmt->fetch();
    
    if (!$userExists) {
        http_response_code(400);
        echo json_encode(['errors' => ['admin_user_id' => 'Invalid admin user ID']]);
        exit;
    }
    
    // Check if society already exists (by society_id or admin_user_id)
    $existingSociety = null;
    if ($society_id > 0) {
        // Check by explicit society_id
        $checkStmt = $pdo->prepare("SELECT society_id, name, logo_url FROM societies WHERE society_id = ?");
        $checkStmt->execute([$society_id]);
        $existingSociety = $checkStmt->fetch(PDO::FETCH_ASSOC);
    } else {
        // Check if this admin already has a society
        $checkStmt = $pdo->prepare("SELECT society_id, name, logo_url FROM societies WHERE admin_user_id = ?");
        $checkStmt->execute([$admin_user_id]);
        $existingSociety = $checkStmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Handle file upload (only if new image is provided)
    $newImagePath = null;
    $oldImagePath = null;
    
    if (isset($_FILES['image']) && $_FILES['image']['error'] === 0) {
        $image = $_FILES['image'];
        $uploadDir = __DIR__ . '/uploads/society_logos/';
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $ext = pathinfo($image['name'], PATHINFO_EXTENSION);
        $allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (!in_array(strtolower($ext), $allowedExts)) {
            http_response_code(400);
            echo json_encode(['errors' => ['image' => 'Invalid image format. Allowed: jpg, jpeg, png, gif, webp']]);
            exit;
        }
        
        // Check file size (e.g., max 5MB)
        if ($image['size'] > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(['errors' => ['image' => 'Image size must be less than 5MB']]);
            exit;
        }
        
        $newFileName = uniqid('soc_', true) . '.' . $ext;
        $destination = $uploadDir . $newFileName;
        $newImagePath = 'uploads/society_logos/' . $newFileName;
        
        if (!move_uploaded_file($image['tmp_name'], $destination)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save image']);
            exit;
        }
        
        // Store old image path for cleanup if update is successful
        if ($existingSociety && !empty($existingSociety['logo_url'])) {
            $oldImagePath = __DIR__ . '/' . $existingSociety['logo_url'];
        }
    }
    
    if ($existingSociety) {
        // UPDATE existing society
        $societyId = $existingSociety['society_id'];
        
        // Check if the name is being changed to something that already exists for another society
        if (strtolower($existingSociety['name']) !== strtolower($name)) {
            $nameCheckStmt = $pdo->prepare("SELECT society_id FROM societies WHERE name = ? AND society_id != ?");
            $nameCheckStmt->execute([$name, $societyId]);
            $nameConflict = $nameCheckStmt->fetch();
            
            if ($nameConflict) {
                // Clean up uploaded image if there was one
                if ($newImagePath && file_exists($destination)) {
                    unlink($destination);
                }
                http_response_code(400);
                echo json_encode(['errors' => ['name' => 'Society name already exists for another society']]);
                exit;
            }
        }
        
        // Prepare update query
        if ($newImagePath) {
            // Update with new image
            $updateStmt = $pdo->prepare("UPDATE societies SET name = ?, description = ?, category = ?, logo_url = ?, updated_at = NOW() WHERE society_id = ?");
            $result = $updateStmt->execute([$name, $description, $category, $newImagePath, $societyId]);
        } else {
            // Update without changing image
            $updateStmt = $pdo->prepare("UPDATE societies SET name = ?, description = ?, category = ?, updated_at = NOW() WHERE society_id = ?");
            $result = $updateStmt->execute([$name, $description, $category, $societyId]);
            $newImagePath = $existingSociety['logo_url']; // Keep existing image path for response
        }
        
        if ($result) {
            // Delete old image file if we uploaded a new one
            if ($oldImagePath && file_exists($oldImagePath) && $newImagePath !== $existingSociety['logo_url']) {
                unlink($oldImagePath);
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true, 
                'message' => 'Society updated successfully',
                'action' => 'updated',
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
            if ($newImagePath && $newImagePath !== $existingSociety['logo_url'] && file_exists($destination)) {
                unlink($destination);
            }
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update society']);
        }
        
    } else {
        // CREATE new society
        
        // Image is required for new societies
        if (!$newImagePath) {
            http_response_code(400);
            echo json_encode(['errors' => ['image' => 'Image upload is required for new societies']]);
            exit;
        }
        
        // Check if society name already exists
        $checkStmt = $pdo->prepare("SELECT society_id FROM societies WHERE name = ?");
        $checkStmt->execute([$name]);
        $nameExists = $checkStmt->fetch();
        
        if ($nameExists) {
            // Clean up uploaded image
            if (file_exists($destination)) {
                unlink($destination);
            }
            http_response_code(400);
            echo json_encode(['errors' => ['name' => 'Society name already exists']]);
            exit;
        }
        
        // Insert new society into database
        $insertStmt = $pdo->prepare("INSERT INTO societies (name, description, category, logo_url, admin_user_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $result = $insertStmt->execute([$name, $description, $category, $newImagePath, $admin_user_id]);
        
        if ($result) {
            $societyId = $pdo->lastInsertId();
            
            http_response_code(201);
            echo json_encode([
                'success' => true, 
                'message' => 'Society created successfully',
                'action' => 'created',
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
            if (file_exists($destination)) {
                unlink($destination);
            }
            http_response_code(500);
            echo json_encode(['error' => 'Failed to create society']);
        }
    }
    
} catch (Exception $e) {
    // Clean up uploaded image on any error
    if (isset($destination) && file_exists($destination)) {
        unlink($destination);
    }
    
    error_log("Society create/update error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Server error occurred']);
}

?>