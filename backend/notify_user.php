<?php
require_once "db_supabase.php";

function notifyUser($user_id, $message, $type = "general")
{
    try {
        $pdo = getSupabaseConnection();
        $sql = "INSERT INTO notifications (user_id, message, type, is_read, created_at) 
                VALUES (?, ?, ?, 0, NOW())";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$user_id, $message, $type]);
        return true;
    } catch (PDOException $e) {
        error_log("Notification insert error: " . $e->getMessage());
        return false;
    }
}
?>