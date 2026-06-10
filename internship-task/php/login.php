<?php
header("Content-Type: application/json");
if (file_exists(__DIR__ . '/env.php')) { include_once __DIR__ . '/env.php'; }
require __DIR__ . '/../../vendor/autoload.php'; // Composer

try {
    $data = json_decode(file_get_contents("php://input"), true);

    // MySQL check
    $url = getenv('CLEARDB_DATABASE_URL');
    if ($url) {
        $dbparts = parse_url($url);
        $host = $dbparts['host'];
        $user = $dbparts['user'];
        $pass = $dbparts['pass'];
        $db = ltrim($dbparts['path'],'/');
        $port = $dbparts['port'] ?? 3306;
    } else {
        $host = "localhost";
        $db = "guvi_intern";
        $user = "root";
        $pass = "";
        $port = 3306;
    }
    
    $conn = mysqli_init();
    if ($url) {
        $conn->ssl_set(NULL, NULL, NULL, NULL, NULL);
        $conn->real_connect($host, $user, $pass, $db, $port, NULL, MYSQLI_CLIENT_SSL);
    } else {
        $conn->real_connect($host, $user, $pass, $db, $port);
    }
    
    if ($conn->connect_error) {
        throw new Exception("MySQL Connection Failed: " . $conn->connect_error);
    }

    $stmt = $conn->prepare("SELECT password FROM users WHERE email = ?");
    $stmt->bind_param("s", $data['email']);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();

    if (!$result || !password_verify($data['password'], $result['password'])) {
        echo json_encode(["status" => "error", "message" => "Invalid credentials. Please make sure you registered first!"]);
        exit;
    }

    // Generate session token
    $token = bin2hex(random_bytes(32));

    // Store token in Redis
    $redis_url = getenv('REDIS_URL');
    if ($redis_url) {
        $parsed = parse_url($redis_url);
        $redis = new Predis\Client([
            'scheme'   => 'tls',
            'host'     => $parsed['host'],
            'port'     => $parsed['port'],
            'password' => $parsed['pass'],
            'username' => $parsed['user'] ?? 'default'
        ]);
    } else {
        $redis = new Predis\Client();
    }
    $redis->setex("session:" . $token, 3600, $data['email']); // expires in 1 hour

    echo json_encode(["status" => "success", "token" => $token, "email" => $data['email']]);
    $stmt->close(); $conn->close();

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
}
?>
