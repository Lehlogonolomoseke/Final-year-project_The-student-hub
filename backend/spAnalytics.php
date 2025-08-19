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
        'budgets' => [],
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

    // 2. SOCIETIES ANALYTICS (FIXED)
    // Get total societies count
    $totalSocietiesQuery = "SELECT COUNT(*) as total FROM societies";
    $stmt = $pdo->prepare($totalSocietiesQuery);
    $stmt->execute();
    $totalSocieties = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

    // Get total members count - FIXED: removed status filter since column doesn't exist
    $totalMembersQuery = "SELECT COUNT(*) as total_members FROM society_members";
    $stmt = $pdo->prepare($totalMembersQuery);
    $stmt->execute();
    $totalMembers = $stmt->fetch(PDO::FETCH_ASSOC)['total_members'];

    // Get top societies by member count - FIXED: removed status filter
    $topSocietiesQuery = "
        SELECT 
            s.society_id,
            s.name,
            COALESCE(member_counts.members, 0) as members
        FROM societies s
        LEFT JOIN (
            SELECT 
                society_id,
                COUNT(*) as members
            FROM society_members 
            GROUP BY society_id
        ) member_counts ON s.society_id = member_counts.society_id
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
        'totalMembers' => (int)$totalMembers,
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

    // 4. BUDGET ANALYTICS (FIXED TO ONLY COUNT 'accepted' STATUS)
    // Get total budget for accepted uploads only - FIXED: changed 'approved' to 'accepted'
    $totalBudgetQuery = "
        SELECT 
            COALESCE(SUM(ec.budget), 0) as total_budget,
            COUNT(ec.id) as total_budget_entries,
            COUNT(DISTINCT ec.upload_id) as uploads_with_budget
        FROM event_costs ec
        INNER JOIN uploads u ON ec.upload_id = u.upload_id
        WHERE u.status = 'accepted'
    ";
    $stmt = $pdo->prepare($totalBudgetQuery);
    $stmt->execute();
    $budgetStats = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get average budget per accepted upload - FIXED: changed 'approved' to 'accepted'
    $avgBudgetQuery = "
        SELECT 
            AVG(ec.budget) as avg_budget
        FROM event_costs ec
        INNER JOIN uploads u ON ec.upload_id = u.upload_id
        WHERE u.status = 'accepted' AND ec.budget > 0
    ";
    $stmt = $pdo->prepare($avgBudgetQuery);
    $stmt->execute();
    $avgBudget = $stmt->fetch(PDO::FETCH_ASSOC);

    // Get top budgets by upload (only accepted) - FIXED: changed 'approved' to 'accepted'
    $topBudgetsQuery = "
        SELECT 
            ec.budget,
            ec.name as budget_name,
            u.upload_id,
            u.event_date,
            ec.comments
        FROM event_costs ec
        INNER JOIN uploads u ON ec.upload_id = u.upload_id
        WHERE u.status = 'accepted'
        ORDER BY ec.budget DESC
        LIMIT 10
    ";
    $stmt = $pdo->prepare($topBudgetsQuery);
    $stmt->execute();
    $topBudgets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format top budgets - FIXED: changed file_name to upload_id since file_name doesn't exist in uploads table
    $topBudgetsFormatted = array_map(function($budget) {
        return [
            'budgetName' => $budget['budget_name'],
            'amount' => (float)$budget['budget'],
            'uploadId' => $budget['upload_id'],
            'eventDate' => $budget['event_date'],
            'comments' => $budget['comments']
        ];
    }, $topBudgets);

    // Get budget distribution by month (last 6 months, only accepted) - FIXED: changed 'approved' to 'accepted'
    $monthlyBudgetQuery = "
        SELECT 
            TO_CHAR(u.uploaded_at, 'Mon YYYY') as month,
            SUM(ec.budget) as total_budget,
            COUNT(ec.id) as budget_count
        FROM event_costs ec
        INNER JOIN uploads u ON ec.upload_id = u.upload_id
        WHERE u.status = 'accepted' 
        AND u.uploaded_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY TO_CHAR(u.uploaded_at, 'Mon YYYY'), DATE_TRUNC('month', u.uploaded_at)
        ORDER BY DATE_TRUNC('month', u.uploaded_at)
        LIMIT 6
    ";
    $stmt = $pdo->prepare($monthlyBudgetQuery);
    $stmt->execute();
    $monthlyBudgets = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format monthly budget data
    $monthlyBudgetsFormatted = array_map(function($month) {
        return [
            'month' => $month['month'],
            'totalBudget' => (float)$month['total_budget'],
            'budgetCount' => (int)$month['budget_count']
        ];
    }, $monthlyBudgets);

    $analyticsData['budgets'] = [
        'totalBudget' => (float)$budgetStats['total_budget'],
        'totalBudgetEntries' => (int)$budgetStats['total_budget_entries'],
        'uploadsWithBudget' => (int)$budgetStats['uploads_with_budget'],
        'averageBudget' => $avgBudget['avg_budget'] ? (float)$avgBudget['avg_budget'] : 0,
        'topBudgets' => $topBudgetsFormatted,
        'monthlyBudgets' => $monthlyBudgetsFormatted
    ];

    // 5. RECENT UPLOADS - FIXED: removed file_name reference and user join issues
    $recentUploadsQuery = "
        SELECT 
            u.upload_id,
            u.uploaded_by,
            u.event_date,
            u.status,
            u.days_until_event,
            u.uploaded_at,
            COALESCE(SUM(ec.budget), 0) as total_budget
        FROM uploads u
        LEFT JOIN event_costs ec ON u.upload_id = ec.upload_id
        GROUP BY u.upload_id, u.uploaded_by, u.event_date, u.status, 
                 u.days_until_event, u.uploaded_at
        ORDER BY u.uploaded_at DESC
        LIMIT 10
    ";
    $stmt = $pdo->prepare($recentUploadsQuery);
    $stmt->execute();
    $recentUploads = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Format recent uploads - FIXED: removed references to non-existent columns
    $recentUploadsFormatted = array_map(function($upload) {
        return [
            'id' => (int)$upload['upload_id'],
            'uploadedBy' => $upload['uploaded_by'] ?? 'Unknown User',
            'eventDate' => $upload['event_date'],
            'status' => $upload['status'],
            'daysUntil' => $upload['days_until_event'] ? (int)$upload['days_until_event'] : 0,
            'uploadedAt' => $upload['uploaded_at'],
            'totalBudget' => (float)$upload['total_budget']
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