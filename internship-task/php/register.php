<?php
header("Content-Type: application/json");
if (file_exists(__DIR__ . '/env.php')) { include_once __DIR__ . '/env.php'; }

try {
    $data = json_decode(file_get_contents("php://input"), true);

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

    $hashed_password = password_hash($data['password'], PASSWORD_BCRYPT);

    $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    if (!$stmt) {
        throw new Exception("MySQL Prepare Failed: " . $conn->error);
    }
    
    $stmt->bind_param("sss", $data['username'], $data['email'], $hashed_password);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Registration successful!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Email already exists or registration failed."]);
    }

    $stmt->close(); $conn->close();

} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
}
?>
