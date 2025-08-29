<?php

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use App\Service\GraphQLService;

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

try {
    $json = json_decode(file_get_contents(__DIR__ . '/../data.json'), true);
    $dataRoot = $json['data'] ?? ['categories' => [], 'products' => []];

    $graphqlService = new GraphQLService($dataRoot);
    
    $input = json_decode(file_get_contents('php://input'), true);
    $query = $input['query'] ?? '';
    $variables = $input['variables'] ?? null;

    $result = $graphqlService->executeQuery($query, $variables);
    echo json_encode($result);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'errors' => [
            [
                'message' => $e->getMessage()
            ]
        ]
    ]);
}

