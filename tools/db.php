<?php

function getDatabaseConnection()
{
    // load from the env file 
    if (!function_exists('env')) {
        function env($key, $default = null) {
            $env = parse_ini_file(__DIR__ . '/../data.env');
            return $env[$key] ?? $default;
        }
    }

    $host = env('DB_HOST', 'mysql');
    $user = env('DB_USER', 'root');
    $pass = env('DB_PASS', '');
    $dbname = env('DB_NAME', 'student_hub');

    // Create connection
    $connection = new mysqli($host, $user, $pass, $dbname);

    if ($connection->connect_error) {
        // error handling
        die("Error: Failed to connect to MySQL: " . $connection->connect_error);
    }

    return $connection;
}
?>
