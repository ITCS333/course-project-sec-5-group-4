<?php


        session_start();


        header('Content-Type: application/json');


        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(['success' => false]);
            exit;
        }


        $rawData = file_get_contents("php://input");
        $data = json_decode($rawData, true);

        if (!isset($data['email']) || !isset($data['password'])) {
            echo json_encode(['success' => false]);
            exit;
        }

        $email = trim($data['email']);
        $password = $data['password'];

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
            echo json_encode(['success' => false]);
            exit;
        }


        require_once __DIR__ . '/../../db.php'; 

    try {
            $db = getDBConnection();

            $sql = "SELECT id, name, email, password, is_admin FROM users WHERE email = :email";
            $stmt = $db->prepare($sql);
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password'])) {
                
                
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_name'] = $user['name'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['is_admin'] = (bool)$user['is_admin'];
                $_SESSION['logged_in'] = true;

                echo json_encode([
                    "success" => true,
                    "message" => "Login successful",
                    "user" => [
                        "id" => (int)$user['id'],
                        "name" => $user['name'],
                        "email" => $user['email'],
                        "is_admin" => (bool)$user['is_admin']
                    ]
                ]);
                exit;

            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
                exit;
            }

  } catch (PDOException $e) {
            error_log($e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Database error']);
            exit;
   }