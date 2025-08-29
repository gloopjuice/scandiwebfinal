import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ItemImages from "./ItemImages";
import ItemSettings from "./ItemSettings";
import { useCart } from "../contexts/CartContext";
import "./ItemPage.css";

function ItemPage() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { addToCart } = useCart();

    useEffect(() => {
        fetchProduct();
    }, [productId]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/database-viewer');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.databaseInfo) {
                const productsTable = data.databaseInfo.find(table => table.tableName === 'products');
                
                if (productsTable && productsTable.data && Array.isArray(productsTable.data)) {
                    const foundProduct = productsTable.data.find(p => p.id === productId);
                    
                    if (foundProduct) {
                        setProduct(foundProduct);
                    } else {
                        throw new Error('Product not found');
                    }
                } else {
                    throw new Error('No products data found');
                }
            } else {
                throw new Error(data.error || 'Failed to fetch product');
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (productWithAttributes) => {
        addToCart(productWithAttributes);
    };

    if (loading) {
        return (
            <div className="item-page">
                <div className="item-page__loading">
                    <div className="loading-spinner"></div>
                    <p>Loading product...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="item-page">
                <div className="item-page__error">
                    <p>Error loading product: {error}</p>
                    <button onClick={fetchProduct} className="item-page__retry-button">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="item-page">
                <div className="item-page__not-found">
                    <p>Product not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="item-page">
            <div className="item-page__container">
                <div className="item-page__content">
                    <ItemImages product={product} />
                    <ItemSettings product={product} onAddToCart={handleAddToCart} />
                </div>
            </div>
        </div>
    );
}

export default ItemPage;