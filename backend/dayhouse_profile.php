<?php 
header('Access-Control-Allow-Origin: http://localhost:3000'); 
header('Access-Control-Allow-Credentials: true'); 
header('Access-Control-Allow-Headers: Content-Type'); 
header('Access-Control-Allow-Methods: POST');  

// Preflight 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {     
    http_response_code(200);     
    exit(); 
}  
// must still do
require 'db.php'; 
$conn = getDatabaseConnection();  

error_log("POST data: " . print_r($_POST, true));
error_log("FILES data: " . print_r($_FILES, true));

if (     
    !isset($_POST['name']) ||     
    !isset($_POST['description']) ||     
    !isset($_FILES['image']) ||     
    !isset($_POST['sports']) 
) {     
    echo json_encode(['error' => 'Missing required fields']);     
    exit; 
}  

$name = $_POST['name']; 
$description = $_POST['description'];  

error_log("Sports raw data: " . $_POST['sports']);

$sports = json_decode($_POST['sports'], true); 

error_log("Sports decoded: " . print_r($sports, true));

// Check if sports is valid array
if (!is_array($sports) || empty($sports)) {
    echo json_encode(['error' => 'Invalid sports data']);
    exit;
}

// Handle image upload 
$targetDir = "../uploads/"; 
$imageName = basename($_FILES["image"]["name"]); 
$targetFile = $targetDir . time() . "_" . $imageName; 
$imageFileType = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));  

$allowedTypes = ['jpg', 'jpeg', 'png', 'gif']; 
if (!in_array($imageFileType, $allowedTypes)) {     
    echo json_encode(['error' => 'Invalid image format']);     
    exit; 
} 

if (!move_uploaded_file($_FILES["image"]["tmp_name"], $targetFile)) {     
    echo json_encode(['error' => 'Image upload failed']);     
    exit; 
}  

// Insert into `dayhouses` 
$stmt = $conn->prepare("INSERT INTO dayhouses (name, description, image) VALUES (?, ?, ?)"); 
$stmt->bind_param("sss", $name, $description, $targetFile);  

if (!$stmt->execute()) {     
    echo json_encode(['error' => 'Failed to insert dayhouse: ' . $stmt->error]);     
    exit; 
}  

$dayhouseId = $stmt->insert_id; 
$stmt->close();  

error_log("Dayhouse ID: " . $dayhouseId);

foreach ($sports as $sportId) {     
    
    error_log("Inserting sport ID: " . $sportId . " for dayhouse ID: " . $dayhouseId);
    
    $insertSport = $conn->prepare("INSERT INTO dayhouse_sports (dayhouse_id, sp_id) VALUES (?, ?)");     
    $insertSport->bind_param("ii", $dayhouseId, $sportId);     
    
    if (!$insertSport->execute()) {
        error_log("Failed to insert sport ID " . $sportId . ": " . $insertSport->error);
    } else {
        error_log("Successfully inserted sport ID " . $sportId);
    }
    
    $insertSport->close(); 
}  

$conn->close(); 
echo json_encode(['success' => 'Dayhouse profile created', 'dayhouse_id' => $dayhouseId]); 
?>