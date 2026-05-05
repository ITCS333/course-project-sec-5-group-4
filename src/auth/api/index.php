<?php
session_start();

header('Content-Type: application/json');

require_once __DIR__ . '/../../db.php';

// MUST be POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request method"
    ]);
    exit;
}

// Read JSON input
$data = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($data['email']) || !isset($data['password'])) {
    echo json_encode([
        "success" => false,
        "message" => "Missing email or password"
    ]);
    exit;
}

$email = trim($data['email']);
$password = $data['password'];

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        "success" => false,
        "message" => "Invalid email format"
    ]);
    exit;
}

// Validate password
if (strlen($password) < 8) {
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 8 characters"
    ]);
    exit;
}

try {
    $db = getDBConnection();

    $stmt = $db->prepare("
        SELECT id, name, email, password, is_admin
        FROM users
        WHERE email = :email
    ");

    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // User not found or wrong password
    if (!$user || !password_verify($password, $user['password'])) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid email or password"
        ]);
        exit;
    }

    // Remove password before sending
    unset($user['password']);

    // Session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['is_admin'] = $user['is_admin'];
    $_SESSION['logged_in'] = true;

    // Success response
    echo json_encode([
        "success" => true,
        "message" => "Login successful",
        "user" => $user
    ]);
    exit;

} catch (PDOException $e) {
    error_log($e->getMessage());

    echo json_encode([
        "success" => false,
        "message" => "Database error"
    ]);
    exit;
}
?>