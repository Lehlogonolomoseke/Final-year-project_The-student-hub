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
    
    // Fetch dayhouses
    $dayhouseQuery = $pdo->prepare("SELECT * FROM dayhouses");
    $dayhouseQuery->execute();
    
    $dayhouses = [];
    
    while ($row = $dayhouseQuery->fetch()) {
        $id = $row['id'];
        
        // Fetch sports for each dayhouse
        $sportsStmt = $pdo->prepare("SELECT s.name FROM dayhouse_sports ds
                                     JOIN sports s ON s.sports_id = ds.sp_id
                                     WHERE ds.dayhouse_id = ?");
        $sportsStmt->execute([$id]);
        
        $sports = [];
        while ($sport = $sportsStmt->fetch()) {
            $sports[] = $sport['name'];
        }
        
        $dayhouses[] = [
            'id' => (int)$id,
            'name' => $row['name'] ?? '',
            'description' => $row['description'] ?? '',
            'image' => $row['image'] ?? '',
            'sports' => $sports
        ];
    }
    
    // Return the expected format that matches your React code
    echo json_encode([
        'success' => true,
        'dayhouses' => $dayhouses
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>