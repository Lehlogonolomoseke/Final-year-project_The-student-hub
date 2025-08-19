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

// Check authentication first - same pattern as analytics
if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit();
}

try {
    require_once('db_supabase.php');
    $pdo = getSupabaseConnection();
    
    if (!$pdo) {
        throw new Exception("Database connection failed");
    }

    $method = $_SERVER['REQUEST_METHOD'];
    $user_id = $_SESSION['id'];

    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'profile';

        if ($action === 'profile') {
            // Initialize response data
            $profileData = [
                'user_info' => null,
                'societies' => [],
                'dayhouses' => [],
                'pending_requests' => []
            ];

            $userQuery = "SELECT id, First_Name as first_name, last_Name as last_name, Email as email FROM users WHERE id = ?";
            $stmt = $pdo->prepare($userQuery);
            $stmt->execute([$user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'User not found']);
                exit();
            }

            $profileData['user_info'] = $user;

            // 2. Get user's societies (both as member and admin)
            $societiesQuery = "
                SELECT 
                    s.society_id,
                    s.name,
                    s.description,
                    s.created_at,
                    s.admin_user_id,
                    CASE 
                        WHEN s.admin_user_id = ? THEN 'admin'
                        ELSE COALESCE(sm.status, 'not_member')
                    END as user_role,
                    sm.joined_at,
                    CASE 
                        WHEN s.admin_user_id = ? THEN 1 
                        ELSE 0 
                    END as is_admin
                FROM societies s
                LEFT JOIN society_members sm ON s.society_id = sm.society_id AND sm.user_id = ?
                WHERE (s.admin_user_id = ? OR (sm.user_id = ? AND sm.status = 'approved'))
                ORDER BY is_admin DESC, sm.joined_at DESC, s.created_at DESC
            ";
            $stmt = $pdo->prepare($societiesQuery);
            $stmt->execute([$user_id, $user_id, $user_id, $user_id, $user_id]);
            $societies = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Convert to proper format
            $profileData['societies'] = array_map(function($society) {
                return [
                    'society_id' => (int)$society['society_id'],
                    'name' => $society['name'],
                    'description' => $society['description'],
                    'created_at' => $society['created_at'],
                    'user_role' => $society['user_role'],
                    'joined_at' => $society['joined_at'],
                    'is_admin' => (bool)$society['is_admin']
                ];
            }, $societies);

            // 3. Get user's dayhouses - simplified version first
            $dayhousesQuery = "
                SELECT 
                    d.id as dayhouse_id,
                    d.name,
                    d.description,
                    d.image,
                    sdp.id as participation_id,
                    sdp.fee_paid,
                    sdp.joined_at
                FROM dayhouses d
                JOIN student_dayhouse_participation sdp ON d.id = sdp.dayhouse_id
                WHERE sdp.user_id = ?
                ORDER BY sdp.joined_at DESC
            ";
            $stmt = $pdo->prepare($dayhousesQuery);
            $stmt->execute([$user_id]);
            $dayhouses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Get sports for each dayhouse separately to avoid GROUP BY issues
            $dayhousesFormatted = [];
            foreach ($dayhouses as $dayhouse) {
                $sportsQuery = "
                    SELECT s.name 
                    FROM student_dayhouse_sports sds
                    JOIN sports s ON sds.sport_id = s.sports_id
                    WHERE sds.participation_id = ?
                ";
                $sportsStmt = $pdo->prepare($sportsQuery);
                $sportsStmt->execute([$dayhouse['participation_id']]);
                $sports = array_column($sportsStmt->fetchAll(PDO::FETCH_ASSOC), 'name');

                $dayhousesFormatted[] = [
                    'dayhouse_id' => (int)$dayhouse['dayhouse_id'],
                    'name' => $dayhouse['name'],
                    'description' => $dayhouse['description'],
                    'image' => $dayhouse['image'],
                    'participation_id' => (int)$dayhouse['participation_id'],
                    'fee_paid' => (bool)$dayhouse['fee_paid'],
                    'joined_at' => $dayhouse['joined_at'],
                    'sports_participated' => $sports
                ];
            }

            $profileData['dayhouses'] = $dayhousesFormatted;

            // 4. Get pending society requests
            $pendingRequestsQuery = "
                SELECT 
                    s.society_id,
                    s.name as society_name,
                    sm.member_id,
                    sm.status,
                    sm.joined_at as request_date
                FROM society_members sm
                JOIN societies s ON sm.society_id = s.society_id
                WHERE sm.user_id = ? AND sm.status = 'pending'
                ORDER BY sm.joined_at DESC
            ";
            $stmt = $pdo->prepare($pendingRequestsQuery);
            $stmt->execute([$user_id]);
            $pendingRequests = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $profileData['pending_requests'] = array_map(function($request) {
                return [
                    'society_id' => (int)$request['society_id'],
                    'society_name' => $request['society_name'],
                    'member_id' => (int)$request['member_id'],
                    'status' => $request['status'],
                    'request_date' => $request['request_date']
                ];
            }, $pendingRequests);

            // 5. Calculate summary
            $summary = [
                'total_societies' => count($profileData['societies']),
                'admin_societies' => count(array_filter($profileData['societies'], function($s) { return $s['is_admin']; })),
                'member_societies' => count(array_filter($profileData['societies'], function($s) { return !$s['is_admin']; })),
                'total_dayhouses' => count($profileData['dayhouses']),
                'paid_dayhouses' => count(array_filter($profileData['dayhouses'], function($d) { return $d['fee_paid']; })),
                'unpaid_dayhouses' => count(array_filter($profileData['dayhouses'], function($d) { return !$d['fee_paid']; })),
                'pending_requests' => count($profileData['pending_requests'])
            ];

            $profileData['summary'] = $summary;

            // Return success response
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'profile' => $profileData
            ]);
        }

        else if ($action === 'societies_only') {
            // Get only societies information for the user
            $societiesQuery = "
                SELECT 
                    s.society_id,
                    s.name,
                    s.description,
                    s.created_at,
                    CASE 
                        WHEN s.admin_user_id = ? THEN 'admin'
                        ELSE COALESCE(sm.status, 'not_member')
                    END as user_role,
                    sm.joined_at,
                    CASE 
                        WHEN s.admin_user_id = ? THEN 1 
                        ELSE 0 
                    END as is_admin
                FROM societies s
                LEFT JOIN society_members sm ON s.society_id = sm.society_id AND sm.user_id = ?
                WHERE (s.admin_user_id = ? OR (sm.user_id = ? AND sm.status = 'approved'))
                ORDER BY is_admin DESC, sm.joined_at DESC, s.created_at DESC
            ";
            $stmt = $pdo->prepare($societiesQuery);
            $stmt->execute([$user_id, $user_id, $user_id, $user_id, $user_id]);
            $societies = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'societies' => $societies,
                'total_count' => count($societies)
            ]);
        }

        else if ($action === 'dayhouses_only') {
            // Get only dayhouses information for the user
            $dayhousesQuery = "
                SELECT 
                    d.id as dayhouse_id,
                    d.name,
                    d.description,
                    d.image,
                    sdp.id as participation_id,
                    sdp.fee_paid,
                    sdp.joined_at
                FROM dayhouses d
                JOIN student_dayhouse_participation sdp ON d.id = sdp.dayhouse_id
                WHERE sdp.user_id = ?
                ORDER BY sdp.joined_at DESC
            ";
            $stmt = $pdo->prepare($dayhousesQuery);
            $stmt->execute([$user_id]);
            $dayhouses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'dayhouses' => $dayhouses,
                'total_count' => count($dayhouses)
            ]);
        }

        else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action parameter']);
        }
    }

    else if ($method === 'PUT') {
        // Update user profile information
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
            exit();
        }
        
        $first_name = trim($input['first_name'] ?? '');
        $last_name = trim($input['last_name'] ?? '');
        
        if (empty($first_name) || empty($last_name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'First name and last name are required']);
            exit();
        }
        
        // Update user information - using correct column names
        $updateStmt = $pdo->prepare("UPDATE users SET First_Name = ?, last_Name = ? WHERE id = ?");
        $success = $updateStmt->execute([$first_name, $last_name, $user_id]);
        
        if ($success) {
            http_response_code(200);
            echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to update profile']);
        }
    }

    else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    error_log("User Profile Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch profile data: ' . $e->getMessage()
    ]);
}

?>