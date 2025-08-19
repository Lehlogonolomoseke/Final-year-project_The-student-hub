<?php
// C:\xampp\htdocs\student-hub\backend\VAPID.php
// problem ran into the openssl.cnf directory 


//C:\xampp\php\extras\ssl\opensll.cnf

// Use __DIR__ to get the directory of the current file, then go up one level
require_once(__DIR__ . '/../vendor/autoload.php');

use Minishlink\WebPush\VAPID;

print_r(VAPID::createVapidKeys());
/*
application server key
[publicKey] => BMyqHIHFB8wBNmcrY0Piuhy5Dp50tMRXjvhiTYLtKlfmnm2Siz1y7XTKvTyRNTpFPXkt3SiTnTJxuesmv9bZ-Og
[privateKey] => G3RlZWPjjTb1lAt_3s3TkvOKv7VBF6gCdapv1U_g38Q

*/    
?>