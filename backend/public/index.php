<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Controller\DatabaseController;
use App\Controller\OrderController;
use App\Service\DatabaseService;
use App\Service\GraphQLService;

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

try {
    if ($requestUri === '/api/database-viewer') {
        $dataFilePath = __DIR__ . '/../data.json';
        $controller = new DatabaseController($dataFilePath);
        $result = $controller->getDatabaseInfo();
        echo json_encode($result);
        exit;
    }

    if ($requestUri === '/api/ping') {
        echo json_encode(['pong' => true]);
        exit;
    }

    if ($requestUri === '/api/order' && $requestMethod === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $host = getenv('DB_HOST') ?: 'localhost';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') ?: '';
        $dbname = getenv('DB_NAME') ?: 'scandiweb_test';
        $port = (int) (getenv('DB_PORT') ?: 3306);

        $databaseService = new DatabaseService($host, $user, $pass, $dbname, $port);
        $pdo = $databaseService->getConnection();
        
        $controller = new OrderController($pdo);
        $result = $controller->createOrder($input);
        
        echo json_encode($result);
        exit;
    }

    if ($requestUri === '/api/graphql' && $requestMethod === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $query = $input['query'] ?? '';
        $variables = $input['variables'] ?? null;

        $jsonFile = __DIR__ . '/../data.json';
        $jsonContent = file_get_contents($jsonFile);
        $data = json_decode($jsonContent, true);
        $dataRoot = $data['data'] ?? ['categories' => [], 'products' => []];

        $graphqlService = new GraphQLService($dataRoot);
        $result = $graphqlService->executeQuery($query, $variables);
        
        echo json_encode($result);
        exit;
    }

    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error' => 'Endpoint not found'
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}