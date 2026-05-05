<?php

// ============================================================================
// HEADERS AND INITIALIZATION
// ============================================================================
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once './config/Database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

$rawData = file_get_contents('php://input');
$data = json_decode($rawData, true);

$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;
$resource_id = $_GET['resource_id'] ?? null;
$comment_id = $_GET['comment_id'] ?? null;


// ============================================================================
// RESOURCE FUNCTIONS
// ============================================================================
function getAllResources($db) {
    $query = "SELECT id, title, description, link, created_at FROM resources";

    $search = $_GET['search'] ?? null;
    if ($search) {
        $query .= " WHERE title LIKE :search OR description LIKE :search";
    }

    $sort = $_GET['sort'] ?? 'created_at';
    $allowedSort = ['title', 'created_at'];
    if (!in_array($sort, $allowedSort)) $sort = 'created_at';

    $order = strtolower($_GET['order'] ?? 'desc');
    if (!in_array($order, ['asc', 'desc'])) $order = 'desc';

    $query .= " ORDER BY $sort $order";

    $stmt = $db->prepare($query);

    if ($search) {
        $stmt->bindValue(':search', "%$search%");
    }

    $stmt->execute();
    $resources = $stmt->fetchAll(PDO::FETCH_ASSOC);

    sendResponse(['success' => true, 'data' => $resources]);
}

function getResourceById($db, $id) {
    if (!$id || !is_numeric($id)) {
        sendResponse(['success' => false, 'message' => 'Invalid ID'], 400);
    }

    $stmt = $db->prepare("SELECT * FROM resources WHERE id = ?");
    $stmt->execute([$id]);

    $resource = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($resource) {
        sendResponse(['success' => true, 'data' => $resource]);
    } else {
        sendResponse(['success' => false, 'message' => 'Resource not found'], 404);
    }
}

function createResource($db, $data) {
    if (empty($data['title']) || empty($data['link'])) {
        sendResponse(['success' => false, 'message' => 'Title and link required'], 400);
    }

    if (!filter_var($data['link'], FILTER_VALIDATE_URL)) {
        sendResponse(['success' => false, 'message' => 'Invalid URL'], 400);
    }

    $stmt = $db->prepare("INSERT INTO resources (title, description, link) VALUES (?, ?, ?)");
    $stmt->execute([
        trim($data['title']),
        trim($data['description'] ?? ''),
        trim($data['link'])
    ]);

    sendResponse([
        'success' => true,
        'id' => $db->lastInsertId()
    ], 201);
}

function updateResource($db, $data) {
    if (empty($data['id'])) {
        sendResponse(['success' => false, 'message' => 'ID required'], 400);
    }

    $fields = [];
    $values = [];

    if (!empty($data['title'])) {
        $fields[] = "title = ?";
        $values[] = trim($data['title']);
    }

    if (!empty($data['description'])) {
        $fields[] = "description = ?";
        $values[] = trim($data['description']);
    }

    if (!empty($data['link'])) {
        if (!filter_var($data['link'], FILTER_VALIDATE_URL)) {
            sendResponse(['success' => false, 'message' => 'Invalid URL'], 400);
        }
        $fields[] = "link = ?";
        $values[] = trim($data['link']);
    }

    if (empty($fields)) {
        sendResponse(['success' => false, 'message' => 'No fields to update'], 400);
    }

    $values[] = $data['id'];

    $query = "UPDATE resources SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $db->prepare($query);
    $stmt->execute($values);

    sendResponse(['success' => true, 'message' => 'Updated successfully']);
}

function deleteResource($db, $id) {
    if (!$id || !is_numeric($id)) {
        sendResponse(['success' => false, 'message' => 'Invalid ID'], 400);
    }

    $stmt = $db->prepare("DELETE FROM resources WHERE id = ?");
    $stmt->execute([$id]);

    sendResponse(['success' => true, 'message' => 'Deleted successfully']);
}


// ============================================================================
// COMMENTS
// ============================================================================
function getCommentsByResourceId($db, $resource_id) {
    $stmt = $db->prepare("SELECT * FROM comments_resource WHERE resource_id = ? ORDER BY created_at ASC");
    $stmt->execute([$resource_id]);

    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(['success' => true, 'data' => $comments]);
}

function createComment($db, $data) {
    if (empty($data['resource_id']) || empty($data['author']) || empty($data['text'])) {
        sendResponse(['success' => false, 'message' => 'Missing fields'], 400);
    }

    $stmt = $db->prepare("INSERT INTO comments_resource (resource_id, author, text) VALUES (?, ?, ?)");
    $stmt->execute([
        $data['resource_id'],
        trim($data['author']),
        trim($data['text'])
    ]);

    sendResponse([
        'success' => true,
        'id' => $db->lastInsertId()
    ], 201);
}

function deleteComment($db, $comment_id) {
    $stmt = $db->prepare("DELETE FROM comments_resource WHERE id = ?");
    $stmt->execute([$comment_id]);

    sendResponse(['success' => true, 'message' => 'Comment deleted']);
}


// ============================================================================
// ROUTER
// ============================================================================
try {
    if ($method === 'GET') {
        if ($action === 'comments') {
            getCommentsByResourceId($db, $resource_id);
        } elseif ($id) {
            getResourceById($db, $id);
        } else {
            getAllResources($db);
        }

    } elseif ($method === 'POST') {
        if ($action === 'comment') {
            createComment($db, $data);
        } else {
            createResource($db, $data);
        }

    } elseif ($method === 'PUT') {
        updateResource($db, $data);

    } elseif ($method === 'DELETE') {
        if ($action === 'delete_comment') {
            deleteComment($db, $comment_id);
        } else {
            deleteResource($db, $id);
        }

    } else {
        sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
    }

} catch (Exception $e) {
    error_log($e->getMessage());
    sendResponse(['success' => false, 'message' => 'Server error'], 500);
}


// ============================================================================
// HELPER
// ============================================================================
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}
?>
