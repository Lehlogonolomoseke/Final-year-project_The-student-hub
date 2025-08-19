<?php
function getSupabaseConnection() {
    $host = 'aws-0-eu-central-1.pooler.supabase.com';
    $port = '5432';
    $dbname = 'postgres';
    $user = 'postgres.vmsqqjqozkkywkkcnuws';
    $password = 'Team44_Project';

    //PDO
    try {
        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
        $pdo = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 10,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        throw new Exception("PDO connection failed: " . $e->getMessage());
    }
}
function getDatabaseConnection() {
    return getSupabaseConnection();
}
?>

