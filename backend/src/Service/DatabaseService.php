<?php

declare(strict_types=1);

namespace App\Service;

use PDO;
use PDOException;

class DatabaseService
{
    private string $host;
    private string $user;
    private string $pass;
    private string $dbname;
    private int $port;

    public function __construct(
        string $host = 'localhost',
        string $user = 'root',
        string $pass = '',
        string $dbname = 'scandiweb_test',
        int $port = 3306
    ) {
        $this->host = $host;
        $this->user = $user;
        $this->pass = $pass;
        $this->dbname = $dbname;
        $this->port = $port;
    }

    public function getConnection(): PDO
    {
        try {
            return new PDO(
                "mysql:host={$this->host};port={$this->port};dbname={$this->dbname}",
                $this->user,
                $this->pass,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]
            );
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Unknown database') !== false) {
                return $this->createDatabaseAndConnect();
            }
            throw $e;
        }
    }

    private function createDatabaseAndConnect(): PDO
    {
        $pdo = new PDO(
            "mysql:host={$this->host};port={$this->port}",
            $this->user,
            $this->pass,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]
        );
        
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$this->dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `{$this->dbname}`");
        
        return $pdo;
    }
}
