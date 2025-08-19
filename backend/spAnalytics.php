<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Check authentication
if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit();
}

try {
    require_once('db_supabase.php');
    $pdo = getSupabaseConnection();

    // Initialize response data
    $analyticsData = [
        'uploads' => [],
        'societies' => [],
        'events' => [],
        'recentUploads' => []
    ];

    // 1. UPLOADS ANALYTICS
    // Get upload status counts
    $uploadStatsQuery = "
        SELECT 
            status,
            COUNT(*) as count
        FROM uploads 
        GROUP BY status
    ";
    $stmt = $pdo->prepare($uploadStatsQuery);
    $stmt->execute();
    $uploadStats = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total uploads count
    $totalUploadsQuery = "SELECT COUNT(*) as total FROM uploads";
    $stmt = $pdo->prepare($totalUploadsQuery);
    $stmt->execute();
    $totalUploads = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Process upload data
    $uploadsByStatus = [];
    $accepted = $rejected = $pending = 0;

    foreach ($uploadStats as $stat) {
        $uploadsByStatus[] = [
            'name' => ucfirst($stat['status']),
            'value' => (int)$stat['count'],
            'color' => $stat['status'] === 'accepted' ? '#10b981' : 
                      ($stat['status'] === 'rejected' ? '#ef4444' : '#f59e0b')
        ];
        
        if ($stat['status'] === 'accepted') $accepted = (int)$stat['count'];
        if ($stat['status'] === 'rejected') $rejected = (int)$stat['count'];
        if ($stat['status'] === 'pending') $pending = (int)$stat['count'];
    }

    $analyticsData['uploads'] = [
        'total' => (int)$totalUploads,
        'accepted' => $accepted,
        'rejected' => $rejected,
        'pending' => $pending,
        'byStatus' => $uploadsByStatus
    ];

    // 2. SOCIETIES ANALYTICS
    // Get total societies count
    $totalSocietiesQuery = "SELECT COUNT(*) as total FROM societies";
    $stmt = $pdo->prepare($totalSocietiesQuery);
    $stmt->execute();
    $totalSocieties = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get top societies by member count
    $topSocietiesQuery = "
        SELECT 
            s.society_id,
            s.name,
            COUNT(sm.member_id) as members
        FROM societies s
        LEFT JOIN society_members sm ON s.society_id = sm.society_id
        WHERE sm.status = 'active' OR sm.status IS NULL
        GROUP BY s.society_id, s.name
        ORDER BY members DESC
        LIMIT 10
    ";
    $stmt = $pdo->prepare($topSocietiesQuery);
    $stmt->execute();
    $topSocieties = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convert to required format
    $topSocietiesFormatted = array_map(function($society) {
        return [
            'name' => $society['name'],
            'members' => (int)$society['members'],
            'society_id' => (int)$society['society_id']
        ];
    }, $topSocieties);

    $analyticsData['societies'] = [
        'total' => (int)$totalSocieties,
        'topSocieties' => $topSocietiesFormatted
    ];

    // 3. EVENTS ANALYTICS
    // Get total events count
    $totalEventsQuery = "SELECT COUNT(*) as total FROM events";
    $stmt = $pdo->prepare($totalEventsQuery);
    $stmt->execute();
    $totalEvents = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get public vs private events
    $eventTypeQuery = "
        SELECT 
            CASE WHEN is_private = true THEN 'private' ELSE 'public' END as event_type,
            COUNT(*) as count
        FROM events
        GROUP BY is_private
    ";
    $stmt = $pdo->prepare($eventTypeQuery);
    $stmt->execute();
    $eventTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $publicEvents = $privateEvents = 0;
    $eventsByType = [];

    foreach ($eventTypes as $type) {
        $eventsByType[] = [
            'name' => ucfirst($type['event_type']) . ' Events',
            'value' => (int)$type['count'],
            'color' => $type['event_type'] === 'public' ? '#3b82f6' : '#8b5cf6'
        ];
        
        if ($type['event_type'] === 'public') $publicEvents = (int)$type['count'];
        if ($type['event_type'] === 'private') $privateEvents = (int)$type['count'];
    }

    // Get monthly events trend (last 5 months)
    $monthlyEventsQuery = "
        SELECT 
            TO_CHAR(created_at, 'Mon') as month,
            COUNT(*) as events
        FROM events
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '4 months'
        GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at)
        LIMIT 5
    ";
    $stmt = $pdo->prepare($monthlyEventsQuery);
    $stmt->execute();
    $monthlyEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format monthly events data
    $monthlyEventsFormatted = array_map(function($month) {
        return [
            'month' => $month['month'],
            'events' => (int)$month['events']
        ];
    }, $monthlyEvents);

    $analyticsData['events'] = [
        'total' => (int)$totalEvents,
        'public' => $publicEvents,
        'private' => $privateEvents,
        'byType' => $eventsByType,
        'monthlyEvents' => $monthlyEventsFormatted
    ];

    // 4. RECENT UPLOADS
    $recentUploadsQuery = "
        SELECT 
            u.upload_id,
            u.file_name,
            u.uploaded_by,
            u.event_date,
            u.status,
            u.days_until_event,
            u.uploaded_at,
            CONCAT(up.first_name, ' ', up.last_name) as uploader_name
        FROM uploads u
        LEFT JOIN users up ON u.uploaded_by = up.id
        ORDER BY u.uploaded_at DESC
        LIMIT 10
    ";
    $stmt = $pdo->prepare($recentUploadsQuery);
    $stmt->execute();
    $recentUploads = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format recent uploads
    $recentUploadsFormatted = array_map(function($upload) {
        return [
            'id' => (int)$upload['upload_id'],
            'fileName' => $upload['file_name'],
            'uploadedBy' => $upload['uploader_name'] ?? 'Unknown User',
            'eventDate' => $upload['event_date'],
            'status' => $upload['status'],
            'daysUntil' => $upload['days_until_event'] ? (int)$upload['days_until_event'] : 0,
            'uploadedAt' => $upload['uploaded_at']
        ];
    }, $recentUploads);

    $analyticsData['recentUploads'] = $recentUploadsFormatted;

    // Return success response with analytics data
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $analyticsData
    ]);

} catch (Exception $e) {
    error_log("Analytics API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Failed to fetch analytics data: ' . $e->getMessage()
    ]);
}
?>