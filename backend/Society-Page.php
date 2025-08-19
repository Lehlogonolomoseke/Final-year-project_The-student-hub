<?php
session_start();
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require_once "db_supabase.php";
    $pdo = getSupabaseConnection();
    
    // Get society ID from URL parameter
    $society_id = $_GET['id'] ?? null;
    
    if (!$society_id) {
        echo json_encode([
            'society_found' => false,
            'error' => 'Society ID is required'
        ]);
        exit;
    }
    
    // Fetch society data
    $stmt = $pdo->prepare("SELECT * FROM societies WHERE society_id = ?");
    $stmt->execute([$society_id]);
    $society = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$society) {
        echo json_encode([
            'society_found' => false,
            'message' => 'Society not found'
        ]);
        exit;
    }
    
    // Check if user is logged in and get membership status
    $is_member = false;
    $membership_status = null;
    $user_logged_in = false;
    
    // FIXED: Check both possible session variables (for compatibility)
    $user_id = $_SESSION['id'] ?? $_SESSION['user_id'] ?? null;
    
    if ($user_id) {
        $user_logged_in = true;
        // Check membership status
        $memberStmt = $pdo->prepare("SELECT status FROM society_members WHERE user_id = ? AND society_id = ?");
        $memberStmt->execute([$user_id, $society_id]);
        $membership = $memberStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($membership) {
            $membership_status = $membership['status'];
            $is_member = ($membership_status === 'approved');
        }
    }
    
    // Return society data in the format expected by React component
    echo json_encode([
        'society_found' => true,
        'society_data' => $society,
        'is_member' => $is_member,
        'membership_status' => $membership_status,
        'user_logged_in' => $user_logged_in // Include login status
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'society_found' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>