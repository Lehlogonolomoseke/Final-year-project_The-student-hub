<?php
if (extension_loaded('openssl')) {
    echo "OpenSSL extension is loaded.\n";
    // Attempt a simple OpenSSL operation
    $data = 'test data';
    $cipher = 'aes-256-cbc';
    $key = openssl_random_pseudo_bytes(openssl_cipher_iv_length($cipher));
    $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($cipher));
    $encrypted = openssl_encrypt($data, $cipher, $key, 0, $iv);
    if ($encrypted !== false) {
        echo "OpenSSL encryption appears to be working.\n";
    } else {
        echo "OpenSSL encryption failed. Error: " . openssl_error_string() . "\n";
    }
} else {
    echo "OpenSSL extension is NOT loaded.\n";
}
?>