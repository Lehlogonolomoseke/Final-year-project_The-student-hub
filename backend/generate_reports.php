<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Content-Type: application/json");
    http_response_code(200);
    exit();
}

session_start();
require_once "db_supabase.php";

// Check if TCPDF is available, if not provide alternative
$tcpdf_available = false;
if (file_exists('vendor/autoload.php')) {
    require_once 'vendor/autoload.php';
    $tcpdf_available = class_exists('TCPDF');
}

// If TCPDF is not available, try alternative methods
if (!$tcpdf_available) {
    // Alternative 1: Try to include TCPDF directly if it exists
    if (file_exists('tcpdf/tcpdf.php')) {
        require_once('tcpdf/tcpdf.php');
        $tcpdf_available = class_exists('TCPDF');
    }
    // Alternative 2: Check if TCPDF is in include path
    elseif (@include_once('tcpdf.php')) {
        $tcpdf_available = class_exists('TCPDF');
    }
}

$pdo = getSupabaseConnection();

// Check if user is authenticated and is an admin
if (!isset($_SESSION['id']) || $_SESSION['role'] !== 'ADMIN') {
    header("Content-Type: application/json");
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit();
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    header("Content-Type: application/json");
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid JSON input']);
    exit();
}

// Validate required fields
$required_fields = ['event_id', 'event_details', 'general_feedback', 'report_date'];
foreach ($required_fields as $field) {
    if (!isset($input[$field])) {
        header("Content-Type: application/json");
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "Missing required field: $field"]);
        exit();
    }
}

$event_id = $input['event_id'];
$event_details = $input['event_details'];
$general_feedback = $input['general_feedback'];
$report_date = $input['report_date'];
$financial_data = $input['financial_data'] ?? [];
$admin_id = $_SESSION['id'];

try {
    // Verify that this admin created the event
    $verify_stmt = $pdo->prepare("
        SELECT e.*, s.name as society_name 
        FROM events e
        LEFT JOIN societies s ON s.admin_user_id = e.created_by
        WHERE e.event_id = ? AND e.created_by = ?
    ");
    $verify_stmt->execute([$event_id, $admin_id]);
    $event_info = $verify_stmt->fetch();

    if (!$event_info) {
        header("Content-Type: application/json");
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Event not found or access denied']);
        exit();
    }

    // If TCPDF is available, generate PDF
    if ($tcpdf_available) {
        generatePDFReport($event_info, $event_details, $general_feedback, $report_date, $financial_data);
    } else {
        // Fallback: Generate HTML report
        generateHTMLReport($event_info, $event_details, $general_feedback, $report_date, $financial_data);
    }

} catch (Exception $e) {
    error_log("Error generating report: " . $e->getMessage());
    header("Content-Type: application/json");
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to generate report: ' . $e->getMessage()
    ]);
}

function generatePDFReport($event_info, $event_details, $general_feedback, $report_date, $financial_data) {
    // Create new PDF document
    $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

    // Set document information
    $pdf->SetCreator('Society Event Management System');
    $pdf->SetAuthor($event_info['society_name'] ?? 'Society Admin');
    $pdf->SetTitle('Event Report: ' . $event_details['name']);
    $pdf->SetSubject('Event Report');

    // Set default header data
    $pdf->SetHeaderData('', 0, 'Event Report', $event_details['name'] . ' - ' . $report_date);

    // Set header and footer fonts
    $pdf->setHeaderFont(Array(PDF_FONT_NAME_MAIN, '', PDF_FONT_SIZE_MAIN));
    $pdf->setFooterFont(Array(PDF_FONT_NAME_DATA, '', PDF_FONT_SIZE_DATA));

    // Set default monospaced font
    $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);

    // Set margins
    $pdf->SetMargins(PDF_MARGIN_LEFT, PDF_MARGIN_TOP, PDF_MARGIN_RIGHT);
    $pdf->SetHeaderMargin(PDF_MARGIN_HEADER);
    $pdf->SetFooterMargin(PDF_MARGIN_FOOTER);

    // Set auto page breaks
    $pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);

    // Set image scale factor
    $pdf->setImageScale(PDF_IMAGE_SCALE_RATIO);

    // Add a page
    $pdf->AddPage();

    // Set font
    $pdf->SetFont('helvetica', '', 12);

    // Generate HTML content
    $html = generateReportHTML($event_info, $event_details, $general_feedback, $report_date, $financial_data);

    // Output the HTML content
    $pdf->writeHTML($html, true, false, true, false, '');

    // Close and output PDF document
    $filename = 'Event_Report_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', $event_details['name']) . '_' . $report_date . '.pdf';
    
    // Set proper headers for PDF download
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: private, max-age=0, must-revalidate');
    header('Pragma: public');
    
    $pdf->Output($filename, 'D');
}

function generateHTMLReport($event_info, $event_details, $general_feedback, $report_date, $financial_data) {
    $filename = 'Event_Report_' . preg_replace('/[^A-Za-z0-9_\-]/', '_', $event_details['name']) . '_' . $report_date . '.html';
    
    // Set headers for HTML download
    header('Content-Type: text/html');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $html = '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Report: ' . htmlspecialchars($event_details['name']) . '</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6; 
            color: #333;
        }
        .header { 
            font-size: 24px; 
            font-weight: bold; 
            color: #2563eb; 
            margin-bottom: 20px; 
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
        }
        .section-header { 
            font-size: 16px; 
            font-weight: bold; 
            color: #1f2937; 
            margin-top: 25px; 
            margin-bottom: 12px; 
            background-color: #f3f4f6; 
            padding: 8px; 
            border-left: 4px solid #2563eb;
        }
        .info-row { 
            margin-bottom: 8px; 
        }
        .label { 
            font-weight: bold; 
            color: #374151;
        }
        .financial-table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-top: 15px; 
        }
        .financial-table th { 
            background-color: #e5e7eb; 
            padding: 12px; 
            border: 1px solid #d1d5db; 
            font-weight: bold; 
        }
        .financial-table td { 
            padding: 10px; 
            border: 1px solid #d1d5db; 
        }
        .total-row { 
            background-color: #f9fafb; 
            font-weight: bold; 
        }
        .positive { 
            color: #059669; 
        }
        .negative { 
            color: #dc2626; 
        }
        .summary-box { 
            background-color: #eff6ff; 
            padding: 15px; 
            border: 1px solid #bfdbfe; 
            margin: 15px 0; 
            border-radius: 5px;
        }
        .feedback-box { 
            background-color: #f9fafb; 
            padding: 15px; 
            border: 1px solid #e5e7eb; 
            margin: 15px 0; 
            font-style: italic; 
            border-radius: 5px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>';
    
    $html .= generateReportHTML($event_info, $event_details, $general_feedback, $report_date, $financial_data);
    
    $html .= '
    <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="padding: 10px 20px; background-color: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Report</button>
    </div>
</body>
</html>';
    
    echo $html;
}

function generateReportHTML($event_info, $event_details, $general_feedback, $report_date, $financial_data) {
    $html = '
    <div class="header">EVENT REPORT</div>
    
    <div class="section-header">EVENT INFORMATION</div>
    <div class="info-row"><span class="label">Event Name:</span> ' . htmlspecialchars($event_details['name']) . '</div>
    <div class="info-row"><span class="label">Society:</span> ' . htmlspecialchars($event_info['society_name'] ?? 'N/A') . '</div>
    <div class="info-row"><span class="label">Date:</span> ' . date('F j, Y', strtotime($event_details['start_date'])) . '</div>
    <div class="info-row"><span class="label">Time:</span> ' . htmlspecialchars($event_details['start_time']) . ' - ' . htmlspecialchars($event_details['end_time']) . '</div>
    <div class="info-row"><span class="label">Location:</span> ' . htmlspecialchars($event_details['location']) . '</div>
    <div class="info-row"><span class="label">Event Type:</span> ' . htmlspecialchars($event_details['event_type']) . '</div>
    ' . ($event_details['capacity'] ? '<div class="info-row"><span class="label">Capacity:</span> ' . $event_details['capacity'] . '</div>' : '') . '
    <div class="info-row"><span class="label">Report Date:</span> ' . date('F j, Y', strtotime($report_date)) . '</div>';

    // Add RSVP and Attendance Summary if available
    $rsvp_counts = $event_details['rsvp_counts'] ?? [];
    $attendance_count = $event_details['attendance_count'] ?? 0;

    if (!empty($rsvp_counts) || $attendance_count > 0) {
        $html .= '
        <div class="section-header">PARTICIPATION SUMMARY</div>
        <div class="summary-box">
            <div class="info-row"><span class="label">RSVP - Interested:</span> ' . ($rsvp_counts['interested'] ?? 0) . '</div>
            <div class="info-row"><span class="label">RSVP - Not Interested:</span> ' . ($rsvp_counts['not_interested'] ?? 0) . '</div>
            <div class="info-row"><span class="label">Actual Attendance:</span> ' . $attendance_count . '</div>';
        
        if ($event_details['capacity']) {
            $attendance_rate = ($attendance_count / $event_details['capacity']) * 100;
            $html .= '<div class="info-row"><span class="label">Attendance Rate:</span> ' . number_format($attendance_rate, 1) . '%</div>';
        }
        
        $html .= '</div>';
    }

    // Add Financial Summary if available
    if (!empty($financial_data) && !empty($financial_data['event_costs'])) {
        $html .= '
        <div class="section-header">FINANCIAL SUMMARY</div>
        <table class="financial-table">
            <thead>
                <tr>
                    <th style="text-align: left;">Cost Item</th>
                    <th style="text-align: right;">Budgeted (R)</th>
                    <th style="text-align: right;">Actual Spent (R)</th>
                    <th style="text-align: right;">Difference (R)</th>
                </tr>
            </thead>
            <tbody>';

        foreach ($financial_data['event_costs'] as $cost) {
            $budgeted = floatval($cost['budget'] ?? 0);
            $actual = floatval($financial_data['actual_spending'][$cost['id']] ?? 0);
            $difference = $budgeted - $actual;
            $diff_class = $difference >= 0 ? 'positive' : 'negative';
            $diff_sign = $difference >= 0 ? '+' : '';

            $html .= '
                <tr>
                    <td>
                        <strong>' . htmlspecialchars($cost['name']) . '</strong>';
            
            if (!empty($cost['comments'])) {
                $html .= '<br><small>' . htmlspecialchars($cost['comments']) . '</small>';
            }
            
            $html .= '
                    </td>
                    <td style="text-align: right;">R' . number_format($budgeted, 2) . '</td>
                    <td style="text-align: right;">R' . number_format($actual, 2) . '</td>
                    <td style="text-align: right;" class="' . $diff_class . '">' . $diff_sign . 'R' . number_format(abs($difference), 2) . '</td>
                </tr>';
        }

        $total_budgeted = $financial_data['total_budgeted'];
        $total_actual = $financial_data['total_actual'];
        $total_savings = $financial_data['savings'];
        $savings_class = $total_savings >= 0 ? 'positive' : 'negative';
        $savings_sign = $total_savings >= 0 ? '+' : '';

        $html .= '
            </tbody>
            <tfoot>
                <tr class="total-row">
                    <td><strong>TOTALS</strong></td>
                    <td style="text-align: right;"><strong>R' . number_format($total_budgeted, 2) . '</strong></td>
                    <td style="text-align: right;"><strong>R' . number_format($total_actual, 2) . '</strong></td>
                    <td style="text-align: right;" class="' . $savings_class . '"><strong>' . $savings_sign . 'R' . number_format(abs($total_savings), 2) . '</strong></td>
                </tr>
            </tfoot>
        </table>
        
        <div class="summary-box">
            <div style="text-align: center;">
                <strong>Financial Performance: ' . ($total_savings >= 0 ? 'Under Budget (Savings)' : 'Over Budget') . '</strong><br>
                <span class="' . $savings_class . '" style="font-size: 18px;">' . $savings_sign . 'R' . number_format(abs($total_savings), 2) . '</span>
            </div>
        </div>';
    }

    // Add General Feedback
    $html .= '
    <div class="section-header">GENERAL FEEDBACK & RECOMMENDATIONS</div>
    <div class="feedback-box">' . nl2br(htmlspecialchars($general_feedback)) . '</div>';

    // Add event description if available
    if (!empty($event_details['description'])) {
        $html .= '
        <div class="section-header">EVENT DESCRIPTION</div>
        <div class="info-row">' . nl2br(htmlspecialchars($event_details['description'])) . '</div>';
    }

    // Add notices if available
    if (!empty($event_details['notices'])) {
        $html .= '
        <div class="section-header">EVENT NOTICES</div>
        <div class="info-row">' . nl2br(htmlspecialchars($event_details['notices'])) . '</div>';
    }

    // Add footer with generation info
    $html .= '
    <br><br>
    <div style="border-top: 1px solid #e5e7eb; padding-top: 15px; font-size: 12px; color: #6b7280;">
        <div><strong>Report Generated:</strong> ' . date('F j, Y \a\t g:i A') . '</div>
        <div><strong>Generated By:</strong> ' . htmlspecialchars($event_info['society_name'] ?? 'Society Admin') . '</div>
        <div><strong>System:</strong> Society Event Management System</div>
    </div>';

    return $html;
}
?>