import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { useCart } from "../contexts/CartContext";
import "./MainPage.css";

function MainPage({ selectedCategory }) {
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart } = useCart();

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedCategory === 'all') {
            setFilteredProducts(allProducts);
        } else {
            setFilteredProducts(allProducts.filter(product => product.category === selectedCategory));
        }
    }, [selectedCategory, allProducts]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('Fetching products from database...');
            const response = await fetch('/api/database-viewer');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API response:', data);
            
            if (data.success && data.databaseInfo) {
                const productsTable = data.databaseInfo.find(table => table.tableName === 'products');
                console.log('Products table found:', productsTable);
                
                if (productsTable && productsTable.data && Array.isArray(productsTable.data)) {
                    // Validate and clean the data
                    const validProducts = productsTable.data.filter(product => 
                        product && 
                        typeof product === 'object' && 
                        product.id && 
                        product.name
                    );
                    
                    console.log('Valid products from database:', validProducts);
                    console.log('Total products found:', validProducts.length);
                    
                    setAllProducts(validProducts);
                    setFilteredProducts(validProducts);
                } else {
                    throw new Error('No valid products data found in database');
                }
            } else {
                throw new Error(data.error || 'Failed to fetch products from database');
            }
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setError(error.message);
            setAllProducts([]);
            setFilteredProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (product) => {
        // For quick add, use the first option of each attribute as default
        const defaultAttributes = {};
        if (product.attributes && product.attributes.length > 0) {
            product.attributes.forEach(attribute => {
                if (attribute.items && attribute.items.length > 0) {
                    defaultAttributes[attribute.id] = attribute.items[0].id;
                }
            });
        }
        
        const productWithDefaultAttributes = {
            ...product,
            selectedAttributes: defaultAttributes
        };
        
        addToCart(productWithDefaultAttributes);
    };

    const getCategoryTitle = () => {
        if (selectedCategory === 'all') return 'All';
        return selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
    };

    if (loading) {
        return (
            <div className="main-page">
                <div className="main-page__loading">
                    <div className="loading-spinner"></div>
                    <p>Loading products from database...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="main-page">
                <div className="main-page__error">
                    <p>Error loading products: {error}</p>
                    <p>Make sure your backend server is running on port 8000</p>
                    <button onClick={fetchProducts} className="main-page__retry-button">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="main-page">
            <div className="main-page__container">
                <h1 className="main-page__title">{getCategoryTitle()}</h1>
                
                <div className="main-page__products-grid">
                    {filteredProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                        />
                    ))}
                </div>
                
                {filteredProducts.length === 0 && !loading && !error && (
                    <div className="main-page__no-products">
                        <p>No products found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MainPage;

