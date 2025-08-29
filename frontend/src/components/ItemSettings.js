import React, { useState } from "react";
import "./ItemSettings.css";

function ItemSettings({ product, onAddToCart }) {
    const [selectedAttributes, setSelectedAttributes] = useState({});
    
    const hasAttributes = product && product.attributes && product.attributes.length > 0;
    const hasPrices = product && product.prices && product.prices.length > 0;
    
    const stripHtmlTags = (htmlString) => {
        if (!htmlString) return "";
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        return tempDiv.textContent || tempDiv.innerText || "";
    };
    
    const shortenSize = (value) => {
        if (!value) return "";
        const size = value.toString().toLowerCase();
        if (size.includes('extra large') || size.includes('xlarge') || size === 'xl') return 'XL';
        if (size.includes('xxlarge') || size === 'xxl') return 'XXL';
        if (size.includes('xxxlarge') || size === 'xxxl') return 'XXXL';
        if (size.includes('large') || size === 'l') return 'L';
        if (size.includes('medium') || size === 'm') return 'M';
        if (size.includes('small') || size === 's') return 'S';
        return value;
    };
    
    const handleAttributeChange = (attributeId, itemId) => {
        setSelectedAttributes(prev => ({
            ...prev,
            [attributeId]: itemId
        }));
    };
    
    const formatPrice = (price) => {
        if (!price || !price.currency) return "Price not available";
        return `${price.currency.symbol}${price.amount.toFixed(2)}`;
    };
    
    const handleAddToCart = () => {
        if (product && product.inStock && onAddToCart) {
            const productWithAttributes = {
                ...product,
                selectedAttributes
            };
            onAddToCart(productWithAttributes);
        }
    };
    
    const canAddToCart = () => {
        if (!product || !product.inStock) return false;
        
        if (hasAttributes) {
            return product.attributes.every(attribute => 
                selectedAttributes[attribute.id] !== undefined
            );
        }
        
        return true;
    };

    return (
        <div className="item-settings">
            <div className="item-settings__header">
                <h1 className="item-settings__name">
                    {product?.name || "Product Name Not Available"}
                </h1>
            </div>
            
            {hasAttributes && product.attributes.map(attribute => (
                <div
                    key={attribute.id}
                    className="item-settings__attribute"
                    data-testid={
                        attribute.type === 'swatch'
                            ? 'product-attribute-color'
                            : attribute.name && attribute.name.toLowerCase() === 'capacity'
                                ? 'product-attribute-capacity'
                                : undefined
                    }
                >
                    <h3 className="item-settings__attribute-name">
                        {attribute.name.toUpperCase()}:
                    </h3>
                    <div className="item-settings__attribute-items">
                        {attribute.items.map(item => {
                            const isSelected = selectedAttributes[attribute.id] === item.id;
                            const isColorType = attribute.type === 'swatch';
                            
                            return (
                                <div
                                    key={item.id}
                                    className={`item-settings__attribute-item ${
                                        isColorType ? 'item-settings__attribute-item--color' : 'item-settings__attribute-item--text'
                                    } ${isSelected ? 'item-settings__attribute-item--selected' : ''}`}
                                    data-testid={
                                        isColorType
                                            ? `product-attribute-color-${item.value}`
                                            : attribute.name && attribute.name.toLowerCase() === 'capacity'
                                                ? `product-attribute-capacity-${item.id}`
                                                : undefined
                                    }
                                    onClick={() => handleAttributeChange(attribute.id, item.id)}
                                    style={isColorType ? { backgroundColor: item.value } : {}}
                                >
                                    {!isColorType && (
                                        <span className="item-settings__attribute-text">
                                            {shortenSize(item.displayValue)}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
            
            <div className="item-settings__price">
                <h3 className="item-settings__price-label">PRICE:</h3>
                <div className="item-settings__price-value">
                    {hasPrices ? formatPrice(product.prices[0]) : "Price not available"}
                </div>
            </div>
            
            <div className="item-settings__actions">
                <button 
                    className={`item-settings__add-to-cart ${
                        canAddToCart() ? 'item-settings__add-to-cart--enabled' : 'item-settings__add-to-cart--disabled'
                    }`}
                    data-testid="add-to-cart"
                    onClick={handleAddToCart}
                    disabled={!canAddToCart()}
                >
                    ADD TO CART
                </button>
            </div>
            
            {product?.description && (
                <div className="item-settings__description" data-testid="product-description">
                    <div className="item-settings__description-content">
                        {stripHtmlTags(product.description)}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ItemSettings;