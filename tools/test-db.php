<?php
require_once 'db.php';

try {
    $db = getDatabaseConnection();
    echo " Connected to the database successfully!";
    $db->close();
} catch (Exception $e) {
    echo " Database connection failed: " . $e->getMessage();
}
?>