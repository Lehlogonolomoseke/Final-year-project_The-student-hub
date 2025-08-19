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
    $dbPath = 'db_supabase.php';
    if (!file_exists($dbPath)) {
        throw new Exception('Database connection file not found: ' . $dbPath);
    }

    require_once $dbPath;
    $pdo = getSupabaseConnection();

    if (!$pdo) {
        throw new Exception('Database connection failed');
    }


    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if (!isset($_GET['id'])) {
            throw new Exception("Dayhouse ID is required");
        }

        $dayhouseId = (int)$_GET['id'];

        $dayhouseStmt = $pdo->prepare("SELECT * FROM dayhouses WHERE id = :id");
        $dayhouseStmt->execute([':id' => $dayhouseId]);
        $dayhouse = $dayhouseStmt->fetch(PDO::FETCH_ASSOC);

        if (!$dayhouse) {
            sendJsonResponse(['success' => false, 'message' => 'Dayhouse not found']);
        }

        $sportsStmt = $pdo->prepare("
            SELECT s.name 
            FROM dayhouse_sports ds
            JOIN sports s ON s.sports_id = ds.sp_id
            WHERE ds.dayhouse_id = :dayhouse_id
        ");
        $sportsStmt->execute([':dayhouse_id' => $dayhouseId]);
        $sports = array_column($sportsStmt->fetchAll(PDO::FETCH_ASSOC), 'name');

        $isAlreadyJoined = false;

        if (!empty($_SESSION['id'])) {
            $userId = $_SESSION['id'];
            $checkJoinStmt = $pdo->prepare("
                SELECT id 
                FROM student_dayhouse_participation 
                WHERE user_id = :user_id AND dayhouse_id = :dayhouse_id
            ");
            $checkJoinStmt->execute([
                ':user_id' => $userId,
                ':dayhouse_id' => $dayhouseId
            ]);
            $isAlreadyJoined = $checkJoinStmt->fetch(PDO::FETCH_ASSOC) !== false;
        }

        sendJsonResponse([
            'success' => true,
            'dayhouse' => [
                'id' => (int)$dayhouse['id'],
                'name' => $dayhouse['name'] ?? '',
                'description' => $dayhouse['description'] ?? '',
                'image' => $dayhouse['image'] ?? '',
                'sports' => $sports
            ],
            'isAlreadyJoined' => $isAlreadyJoined
        ]);
    }


    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {


        if (empty($_SESSION['id'])) {
            sendJsonResponse(['success' => false, 'message' => 'User not logged in'], 401);
        }

        $userId = $_SESSION['id'];
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input || !isset($input['dayhouse_id'], $input['selected_sports'])) {
            sendJsonResponse(['success' => false, 'message' => 'Missing required data'], 400);
        }

        $dayhouseId = (int)$input['dayhouse_id'];
        $selectedSports = $input['selected_sports'];

        if (!is_array($selectedSports)) {
            sendJsonResponse(['success' => false, 'message' => 'Selected sports must be an array'], 400);
        }

        $checkStmt = $pdo->prepare("
            SELECT id 
            FROM student_dayhouse_participation 
            WHERE user_id = :user_id AND dayhouse_id = :dayhouse_id
        ");
        $checkStmt->execute([':user_id' => $userId, ':dayhouse_id' => $dayhouseId]);
        if ($checkStmt->fetch(PDO::FETCH_ASSOC)) {
            sendJsonResponse(['success' => false, 'message' => 'Already joined this dayhouse'], 400);
        }

        $pdo->beginTransaction();
        try {
            $insertStmt = $pdo->prepare("
                INSERT INTO student_dayhouse_participation (user_id, dayhouse_id, joined_at) 
                VALUES (:user_id, :dayhouse_id, NOW())
            ");
            $insertStmt->execute([':user_id' => $userId, ':dayhouse_id' => $dayhouseId]);
            $participationId = $pdo->lastInsertId();

            if (!$participationId) {
                throw new Exception("Could not get participation ID");
            }

            foreach ($selectedSports as $sport) {
                $sportStmt = $pdo->prepare("SELECT sports_id FROM sports WHERE name = :sport_name");
                $sportStmt->execute([':sport_name' => $sport]);
                $sportData = $sportStmt->fetch(PDO::FETCH_ASSOC);

                if ($sportData) {
                    $sportParticipationStmt = $pdo->prepare("
                        INSERT INTO student_dayhouse_sports (participation_id, sport_id) 
                        VALUES (:participation_id, :sport_id)
                    ");
                    $sportParticipationStmt->execute([
                        ':participation_id' => $participationId,
                        ':sport_id' => $sportData['sports_id']
                    ]);
                } else {
                    error_log("Sport not found: " . $sport);
                }
            }

            $pdo->commit();
            sendJsonResponse(['success' => true, 'message' => 'Successfully joined dayhouse']);

        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

 
    else {
        sendJsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
    }

} catch (Exception $e) {
    error_log("Error in join-dayhouse.php: " . $e->getMessage());
    sendJsonResponse([
        'success' => false,
        'error' => $e->getMessage(),
        'debug_info' => [
            'php_version' => phpversion(),
            'file_path' => __FILE__,
            'working_directory' => getcwd(),
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], 500);
}
?>