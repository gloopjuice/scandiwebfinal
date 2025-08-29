<?php
require __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Doctrine\DBAL\DriverManager;

$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

$host   = $_ENV['DB_HOST'] ?? 'localhost';
$user   = $_ENV['DB_USER'] ?? 'root';
$pass   = $_ENV['DB_PASS'] ?? '';
$dbname = $_ENV['DB_NAME'] ?? 'scandiweb_test';
$port   = $_ENV['DB_PORT'] ?? 3306;

try {
    $pdo = new PDO("mysql:host=$host;port=$port", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");

    $pdo->exec("SET FOREIGN_KEY_CHECKS=0");
    $pdo->exec("DROP TABLE IF EXISTS product_attribute_items");
    $pdo->exec("DROP TABLE IF EXISTS product_attribute_sets");
    $pdo->exec("DROP TABLE IF EXISTS attribute_items");
    $pdo->exec("DROP TABLE IF EXISTS attribute_sets");
    $pdo->exec("DROP TABLE IF EXISTS gallery_images");
    $pdo->exec("DROP TABLE IF EXISTS prices");
    $pdo->exec("DROP TABLE IF EXISTS products");
    $pdo->exec("DROP TABLE IF EXISTS categories");
    $pdo->exec("SET FOREIGN_KEY_CHECKS=1");

    $pdo->exec("
        CREATE TABLE categories (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $pdo->exec("
        CREATE TABLE products (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            in_stock TINYINT(1) NOT NULL,
            description TEXT,
            brand VARCHAR(255),
            category_id INT UNSIGNED,
            FOREIGN KEY (category_id) REFERENCES categories(id)
                ON DELETE SET NULL ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $pdo->exec("
        CREATE TABLE gallery_images (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            product_id VARCHAR(255),
            url TEXT,
            FOREIGN KEY (product_id) REFERENCES products(id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $pdo->exec("
        CREATE TABLE prices (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            product_id VARCHAR(255),
            amount FLOAT,
            currency_label VARCHAR(10),
            currency_symbol VARCHAR(5),
            FOREIGN KEY (product_id) REFERENCES products(id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $pdo->exec("
        CREATE TABLE attribute_sets (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255),
            type VARCHAR(50)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $pdo->exec("
        CREATE TABLE attribute_items (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            attribute_set_id INT UNSIGNED,
            display_value VARCHAR(255),
            value VARCHAR(255),
            FOREIGN KEY (attribute_set_id) REFERENCES attribute_sets(id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $pdo->exec("
        CREATE TABLE product_attribute_sets (
            product_id VARCHAR(255),
            attribute_set_id INT UNSIGNED,
            PRIMARY KEY (product_id, attribute_set_id),
            FOREIGN KEY (product_id) REFERENCES products(id)
                ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (attribute_set_id) REFERENCES attribute_sets(id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    $pdo->exec("
        CREATE TABLE product_attribute_items (
            product_id VARCHAR(255),
            attribute_item_id INT UNSIGNED,
            PRIMARY KEY (product_id, attribute_item_id),
            FOREIGN KEY (product_id) REFERENCES products(id)
                ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (attribute_item_id) REFERENCES attribute_items(id)
                ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    echo "Tables created.\n";

} catch (PDOException $e) {
    die("Error: " . $e->getMessage());
}

$conn = DriverManager::getConnection([
    'dbname' => $dbname,
    'user' => $user,
    'password' => $pass,
    'host' => $host,
    'port' => $port,
    'driver' => 'pdo_mysql',
]);

$data = json_decode(file_get_contents(__DIR__ . '/../data.json'), true);
$categories = $data['data']['categories'] ?? [];
$products   = $data['data']['products'] ?? [];

$categoryMap = [];
foreach ($categories as $cat) {
    $conn->insert('categories', ['name' => $cat['name']]);
    $categoryMap[$cat['name']] = $conn->lastInsertId();
}

$attributeSetMap = []; 
$attributeItemMap = []; 

foreach ($products as $product) {
    $conn->insert('products', [
        'id' => $product['id'],
        'name' => $product['name'],
        'in_stock' => $product['inStock'] ? 1 : 0,
        'description' => $product['description'],
        'brand' => $product['brand'],
        'category_id' => $categoryMap[$product['category']] ?? null,
    ]);

    foreach ($product['gallery'] as $url) {
        $conn->insert('gallery_images', [
            'product_id' => $product['id'],
            'url' => $url,
        ]);
    }

    foreach ($product['prices'] as $price) {
        $conn->insert('prices', [
            'product_id' => $product['id'],
            'amount' => $price['amount'],
            'currency_label' => $price['currency']['label'],
            'currency_symbol' => $price['currency']['symbol'],
        ]);
    }

    foreach ($product['attributes'] as $attrSet) {
        $attrKey = $attrSet['name'] . '_' . $attrSet['type'];

        if (!isset($attributeSetMap[$attrKey])) {
            $conn->insert('attribute_sets', [
                'name' => $attrSet['name'],
                'type' => $attrSet['type'],
            ]);
            $attributeSetMap[$attrKey] = $conn->lastInsertId();
        }

        $attrSetId = $attributeSetMap[$attrKey];

        $conn->insert('product_attribute_sets', [
            'product_id' => $product['id'],
            'attribute_set_id' => $attrSetId,
        ]);

        foreach ($attrSet['items'] as $item) {
            $itemKey = $attrSetId . '_' . $item['value'];

            if (!isset($attributeItemMap[$itemKey])) {
                $conn->insert('attribute_items', [
                    'attribute_set_id' => $attrSetId,
                    'display_value' => $item['displayValue'],
                    'value' => $item['value'],
                ]);
                $attributeItemMap[$itemKey] = $conn->lastInsertId();
            }

            $conn->insert('product_attribute_items', [
                'product_id' => $product['id'],
                'attribute_item_id' => $attributeItemMap[$itemKey],
            ]);
        }
    }
}

echo "Data imported.\n";
