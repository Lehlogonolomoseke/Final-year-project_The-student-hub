<?php
require_once(__DIR__ . '/../vendor/autoload.php');

use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

$auth = [
    'VAPID' => [
        'subject' => 'wwe:smackdown@hub.com',
        'publicKey' => $_ENV['VAPID_PUBLIC_KEY'],
        'privateKey' => $_ENV['VAPID_PRIVATE_KEY'],
    ],
];

$webPush = new WebPush($auth);

// Notification infomation
$notificationContent = [
    "title" => "New Message",
    "body" => "You have something nice!",
    "url" => "./message=123"
];

// Load subscriptions from file(change later)
$subscriptionFile = 'subscriptions.json';

if (!file_exists($subscriptionFile)) {
    die("No subscriptions found. Please register for push notifications first.\n");
}

$subscriptionsData = json_decode(file_get_contents($subscriptionFile), true);

if (empty($subscriptionsData)) {
    die("No valid subscriptions found.\n");
}

// Send notification to all subscribers
foreach ($subscriptionsData as $index => $subscriptionData) {
    try {
        // Create subscription object
        $subscription = Subscription::create($subscriptionData);
        
        // Send notification
        $report = $webPush->sendOneNotification(
            $subscription,
            json_encode($notificationContent),
            ['TTL' => 5000]
        );
        
        echo "Subscription " . ($index + 1) . ":\n";
        
        if ($report->isSuccess()) {
            echo " Notification sent successfully!\n";
        } else {
            echo "Failed to send notification:\n";
            echo "Reason: " . $report->getReason() . "\n";
        
        }
        
        echo "Endpoint: " . $subscriptionData['endpoint'] . "\n";
        echo "---\n";
        //error handling
    } catch (Exception $e) {
        echo " Error with subscription " . ($index + 1) . ": " . $e->getMessage() . "\n";
        echo "---\n";
    }
}

echo "Push notification sending completed.\n";
?>