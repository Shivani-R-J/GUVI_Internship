<?php
header("Content-Type: application/json");
if (file_exists(__DIR__ . '/env.php')) { include_once __DIR__ . '/env.php'; }
require __DIR__ . '/../../vendor/autoload.php';

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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $token = $_GET['token'];
    $email = $redis->get("session:" . $token);
    
    if (!$email) {
        echo json_encode(["status" => "error", "message" => "Session expired"]);
        exit;
    }

    // Fetch from MongoDB
    $mongo_url = getenv('MONGODB_URI') ?: "mongodb://localhost:27017";
    $mongo = new MongoDB\Client($mongo_url);
    $collection = $mongo->guvi_intern->profiles;
    $profile = $collection->findOne(["email" => $email]);

    echo json_encode([
        "status" => "success",
        "data" => [
            "age" => $profile['age'] ?? "",
            "dob" => $profile['dob'] ?? "",
            "contact" => $profile['contact'] ?? "",
            "address" => $profile['address'] ?? ""
        ]
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $email = $redis->get("session:" . $data['token']);

    if (!$email) {
        echo json_encode(["status" => "error", "message" => "Session expired"]);
        exit;
    }

    $mongo_url = getenv('MONGODB_URI') ?: "mongodb://localhost:27017";
    $mongo = new MongoDB\Client($mongo_url);
    $collection = $mongo->guvi_intern->profiles;
    
    $collection->updateOne(
        ["email" => $email],
        ['$set' => [
            "age" => $data['age'],
            "dob" => $data['dob'],
            "contact" => $data['contact'],
            "address" => $data['address']
        ]],
        ["upsert" => true]
    );

    echo json_encode(["status" => "success", "message" => "Profile updated!"]);
}
?>
