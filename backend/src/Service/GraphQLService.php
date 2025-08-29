<?php

declare(strict_types=1);

namespace App\Service;

use GraphQL\GraphQL;
use GraphQL\Schema;
use GraphQL\Type\Definition\ObjectType;
use GraphQL\Type\Definition\Type;

class GraphQLService
{
    private array $dataRoot;

    public function __construct(array $dataRoot)
    {
        $this->dataRoot = $dataRoot;
    }

    public function executeQuery(string $query, ?array $variables = null): array
    {
        $schema = $this->createSchema();
        
        return GraphQL::executeQuery($schema, $query, null, null, $variables)->toArray();
    }

    private function createSchema(): Schema
    {
        $attributeItemType = new ObjectType([
            'name' => 'AttributeItem',
            'fields' => [
                'displayValue' => Type::string(),
                'value' => Type::string(),
                'id' => Type::string(),
            ],
        ]);

        $attributeSetType = new ObjectType([
            'name' => 'AttributeSet',
            'fields' => function () use ($attributeItemType) {
                return [
                    'id' => Type::string(),
                    'name' => Type::string(),
                    'type' => Type::string(),
                    'items' => Type::listOf($attributeItemType),
                ];
            }
        ]);

        $priceType = new ObjectType([
            'name' => 'Price',
            'fields' => [
                'amount' => Type::float(),
                'currency' => new ObjectType([
                    'name' => 'Currency',
                    'fields' => [
                        'label' => Type::string(),
                        'symbol' => Type::string(),
                    ]
                ])
            ]
        ]);

        $productType = new ObjectType([
            'name' => 'Product',
            'fields' => function () use ($attributeSetType, $priceType) {
                return [
                    'id' => Type::string(),
                    'name' => Type::string(),
                    'inStock' => Type::boolean(),
                    'gallery' => Type::listOf(Type::string()),
                    'description' => Type::string(),
                    'category' => Type::string(),
                    'brand' => Type::string(),
                    'attributes' => Type::listOf($attributeSetType),
                    'prices' => Type::listOf($priceType),
                ];
            }
        ]);

        $categoryType = new ObjectType([
            'name' => 'Category',
            'fields' => [
                'name' => Type::string(),
            ],
        ]);

        $queryType = new ObjectType([
            'name' => 'Query',
            'fields' => [
                'categories' => [
                    'type' => Type::listOf($categoryType),
                    'resolve' => function () {
                        return $this->dataRoot['categories'];
                    }
                ],
                'products' => [
                    'type' => Type::listOf($productType),
                    'args' => ['category' => ['type' => Type::string()]],
                    'resolve' => function ($root, $args) {
                        $products = $this->dataRoot['products'];
                        if (isset($args['category']) && $args['category'] !== 'all') {
                            $products = array_values(array_filter($products, function ($p) use ($args) {
                                return isset($p['category']) && $p['category'] === $args['category'];
                            }));
                        }
                        return $products;
                    }
                ],
                'product' => [
                    'type' => $productType,
                    'args' => ['id' => ['type' => Type::nonNull(Type::string())]],
                    'resolve' => function ($root, $args) {
                        $products = $this->dataRoot['products'];
                        foreach ($products as $product) {
                            if ($product['id'] === $args['id']) {
                                return $product;
                            }
                        }
                        return null;
                    }
                ],
            ],
        ]);

        $mutationType = new ObjectType([
            'name' => 'Mutation',
            'fields' => [
                'createOrder' => [
                    'type' => new ObjectType([
                        'name' => 'OrderResult',
                        'fields' => [
                            'success' => Type::boolean(),
                            'orderId' => Type::int(),
                            'error' => Type::string(),
                        ],
                    ]),
                    'args' => [
                        'items' => Type::nonNull(Type::listOf(Type::string())),
                        'total' => Type::float(),
                    ],
                    'resolve' => function ($root, $args) {
                        return [
                            'success' => true,
                            'orderId' => 1,
                            'error' => null,
                        ];
                    }
                ],
            ],
        ]);

        return new Schema([
            'query' => $queryType,
            'mutation' => $mutationType,
        ]);
    }
}
