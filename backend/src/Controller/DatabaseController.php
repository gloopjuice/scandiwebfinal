<?php

declare(strict_types=1);

namespace App\Controller;

use Exception;

class DatabaseController
{
    private string $dataFilePath;

    public function __construct(string $dataFilePath)
    {
        $this->dataFilePath = $dataFilePath;
    }

    public function getDatabaseInfo(): array
    {
        try {
            if (!file_exists($this->dataFilePath)) {
                throw new Exception('Data file not found');
            }

            $jsonContent = file_get_contents($this->dataFilePath);
            $data = json_decode($jsonContent, true);

            if (!$data || !isset($data['data'])) {
                throw new Exception('Invalid JSON data structure');
            }

            $databaseInfo = [];

            if (isset($data['data']['categories'])) {
                $databaseInfo[] = [
                    'tableName' => 'categories',
                    'columns' => [
                        ['Field' => 'name', 'Type' => 'varchar(255)', 'Null' => 'NO', 'Key' => 'PRI'],
                        ['Field' => '__typename', 'Type' => 'varchar(255)', 'Null' => 'YES', 'Key' => '']
                    ],
                    'data' => $data['data']['categories'],
                    'totalRows' => count($data['data']['categories']),
                    'displayedRows' => count($data['data']['categories'])
                ];
            }

            if (isset($data['data']['products'])) {
                $databaseInfo[] = [
                    'tableName' => 'products',
                    'columns' => [
                        ['Field' => 'id', 'Type' => 'varchar(255)', 'Null' => 'NO', 'Key' => 'PRI'],
                        ['Field' => 'name', 'Type' => 'varchar(255)', 'Null' => 'NO', 'Key' => ''],
                        ['Field' => 'inStock', 'Type' => 'boolean', 'Null' => 'NO', 'Key' => ''],
                        ['Field' => 'gallery', 'Type' => 'json', 'Null' => 'YES', 'Key' => ''],
                        ['Field' => 'category', 'Type' => 'varchar(255)', 'Null' => 'NO', 'Key' => ''],
                        ['Field' => 'prices', 'Type' => 'json', 'Null' => 'YES', 'Key' => '']
                    ],
                    'data' => $data['data']['products'],
                    'totalRows' => count($data['data']['products']),
                    'displayedRows' => count($data['data']['products'])
                ];
            }

            return [
                'success' => true,
                'databaseInfo' => $databaseInfo
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
