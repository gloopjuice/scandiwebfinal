<?php

declare(strict_types=1);

namespace App\Controller;

use Exception;
use PDO;
use PDOException;

class OrderController
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function createOrder(array $input): array
    {
        try {
            if (!$input || !isset($input['items']) || !is_array($input['items'])) {
                throw new Exception('Invalid payload');
            }

            $this->ensureTablesExist();

            $this->pdo->beginTransaction();

            $total = isset($input['total']) ? (float) $input['total'] : 0.0;
            $currencyLabel = $input['currency']['label'] ?? ($input['items'][0]['price']['currency']['label'] ?? 'USD');
            $currencySymbol = $input['currency']['symbol'] ?? ($input['items'][0]['price']['currency']['symbol'] ?? '$');

            $stmt = $this->pdo->prepare("INSERT INTO orders (total_amount, currency_label, currency_symbol) VALUES (?, ?, ?)");
            $stmt->execute([$total, $currencyLabel, $currencySymbol]);
            $orderId = (int) $this->pdo->lastInsertId();

            $itemStmt = $this->pdo->prepare("INSERT INTO order_items (order_id, product_id, name, quantity, price_amount, currency_label, currency_symbol, selected_attributes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

            foreach ($input['items'] as $item) {
                $productId = $item['id'] ?? '';
                $name = $item['name'] ?? '';
                $quantity = (int) ($item['quantity'] ?? 1);
                $priceAmount = (float) ($item['price']['amount'] ?? 0);
                $cLabel = $item['price']['currency']['label'] ?? $currencyLabel;
                $cSymbol = $item['price']['currency']['symbol'] ?? $currencySymbol;
                $attrs = isset($item['selectedAttributes']) ? json_encode($item['selectedAttributes']) : null;
                $itemStmt->execute([$orderId, $productId, $name, $quantity, $priceAmount, $cLabel, $cSymbol, $attrs]);
            }

            $this->pdo->commit();

            return ['success' => true, 'orderId' => $orderId];
        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    private function ensureTablesExist(): void
    {
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS orders (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_amount DECIMAL(10,2) DEFAULT 0,
            currency_label VARCHAR(10) DEFAULT 'USD',
            currency_symbol VARCHAR(5) DEFAULT '$'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

        $this->pdo->exec("CREATE TABLE IF NOT EXISTS order_items (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            order_id INT UNSIGNED NOT NULL,
            product_id VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            quantity INT UNSIGNED NOT NULL,
            price_amount DECIMAL(10,2) NOT NULL,
            currency_label VARCHAR(10) NOT NULL,
            currency_symbol VARCHAR(5) NOT NULL,
            selected_attributes JSON NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    }
}
