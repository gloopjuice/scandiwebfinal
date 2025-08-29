import React, { useEffect, useState } from "react";
import { useCart } from "../contexts/CartContext";
import "./Cart.css";

function Cart({ isOpen, onClose }) {
    const { items, removeFromCart, updateQuantity, updateAttributes, getTotalItems, getTotalPrice, clearCart } = useCart();
    const [panelTop, setPanelTop] = useState(78);

    useEffect(() => {
        if (isOpen) {
            setPanelTop(window.scrollY + 78);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const formatPrice = (price) => {
        if (!price || !price.currency) return "Price not available";
        return `${price.currency.symbol}${price.amount.toFixed(2)}`;
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

    const handleQuantityChange = (itemIndex, change) => {
        const currentQuantity = items[itemIndex].quantity;
        updateQuantity(itemIndex, currentQuantity + change);
    };

    const handleAttributeChange = (itemIndex, attributeId, itemId) => {
        updateAttributes(itemIndex, attributeId, itemId);
    };

    const getItemCountText = () => {
        const totalItems = getTotalItems();
        return totalItems === 1 ? "item" : "items";
    };

    const getAttrTextSizeClass = (value) => {
        if (!value) return "";
        const len = String(value).length;
        if (len > 5) return "cart-attribute-text--xsmall";
        if (len > 3) return "cart-attribute-text--small";
        return "";
    };

    return (
        <>
            <div className="cart-overlay" data-testid="cart-overlay" onClick={onClose}></div>
            
            <div className="cart-panel" style={{ position: 'absolute', top: `${panelTop}px`, right: '101px' }}>
                <div className="cart-header">
                    <h2 className="cart-title">My Bag, {getTotalItems()} {getItemCountText()}</h2>
                </div>

                <div className="cart-items">
                    {items.map((item, index) => (
                        <div key={`${item.id}-${index}`} className="cart-item">
                            <div className="cart-item-content">
                                <div className="cart-item-left">
                                    <div className="cart-item-info">
                                        <h3 className="cart-item-title">{item.name}</h3>
                                        <div className="cart-item-price">
                                            {formatPrice(item.prices && item.prices[0])}
                                        </div>
                                        
                                        {item.attributes && item.attributes.map(attribute => (
                                            <div key={attribute.id} className="cart-item-attribute">
                                                <div className="cart-item-attribute-name">
                                                    {attribute.name}:
                                                </div>
                                                <div className="cart-item-attribute-items">
                                                    {attribute.items.map(attrItem => {
                                                        const isSelected = item.selectedAttributes[attribute.id] === attrItem.id;
                                                        const isColorType = attribute.type === 'swatch';
                                                        
                                                        return (
                                                            <div
                                                                key={attrItem.id}
                                                                className={`cart-attribute-item ${
                                                                    isColorType ? 'cart-attribute-item--color' : 'cart-attribute-item--text'
                                                                } ${isSelected ? 'cart-attribute-item--selected' : ''}`}
                                                                onClick={() => handleAttributeChange(index, attribute.id, attrItem.id)}
                                                                style={isColorType ? { backgroundColor: attrItem.value } : {}}
                                                            >
                                                                {!isColorType && (
                                                                    <span className={`cart-attribute-text ${getAttrTextSizeClass(attrItem.displayValue)}`}>
                                                                        {shortenSize(attrItem.displayValue)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="cart-item-right">
                                    <div className="cart-item-quantity">
                                        <button 
                                            className="cart-quantity-btn"
                                            onClick={() => handleQuantityChange(index, 1)}
                                        >
                                            +
                                        </button>
                                        <span className="cart-quantity-value">{item.quantity}</span>
                                        <button 
                                            className="cart-quantity-btn"
                                            onClick={() => handleQuantityChange(index, -1)}
                                        >
                                            -
                                        </button>
                                    </div>
                                    
                                    <div className="cart-item-image">
                                        <img 
                                            src={item.gallery && item.gallery[0]} 
                                            alt={item.name}
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/121x164?text=No+Image";
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {items.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-total">
                            <span className="cart-total-label">Total</span>
                            <span className="cart-total-price">
                                {formatPrice({ amount: getTotalPrice(), currency: items[0]?.prices?.[0]?.currency })}
                            </span>
                        </div>
                        
                        <div className="cart-actions">
                            <button className="cart-checkout-btn" onClick={async () => {
                                try {
                                    const payload = {
                                        items: items.map(it => ({
                                            id: it.id,
                                            name: it.name,
                                            quantity: it.quantity,
                                            price: it.prices && it.prices[0] ? it.prices[0] : { amount: 0, currency: { label: 'USD', symbol: '$' } },
                                            selectedAttributes: it.selectedAttributes || {}
                                        })),
                                        total: getTotalPrice(),
                                        currency: items[0]?.prices?.[0]?.currency || { label: 'USD', symbol: '$' }
                                    };
                                    const res = await fetch('/api/order', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload)
                                    });
                                    const data = await res.json();
                                    if (!res.ok || !data.success) throw new Error(data.error || 'Order failed');
                                    alert('Order placed successfully!');
                                    clearCart();
                                    onClose && onClose();
                                } catch (e) {
                                    alert('Failed to place order: ' + e.message);
                                }
                            }}>
                                CHECKOUT
                            </button>
                        </div>
                    </div>
                )}

                {items.length === 0 && (
                    <div className="cart-empty">
                        <p>Your cart is empty</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default Cart; 