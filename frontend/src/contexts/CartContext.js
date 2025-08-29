import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

// Local storage key for cart data
const CART_STORAGE_KEY = 'scandiweb_cart';

// Load cart from local storage
const loadCartFromStorage = () => {
    try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY);
        return savedCart ? JSON.parse(savedCart) : { items: [] };
    } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        return { items: [] };
    }
};

// Save cart to local storage
const saveCartToStorage = (cartData) => {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
        console.error('Error saving cart to localStorage:', error);
    }
};

const cartReducer = (state, action) => {
    let newState;
    
    switch (action.type) {
        case 'ADD_TO_CART':
            const existingItemIndex = state.items.findIndex(item => 
                item.id === action.payload.id && 
                JSON.stringify(item.selectedAttributes) === JSON.stringify(action.payload.selectedAttributes)
            );
            
            if (existingItemIndex >= 0) {
                const updatedItems = [...state.items];
                updatedItems[existingItemIndex].quantity += 1;
                newState = { ...state, items: updatedItems };
            } else {
                newState = {
                    ...state,
                    items: [...state.items, { ...action.payload, quantity: 1 }]
                };
            }
            break;
            
        case 'REMOVE_FROM_CART':
            newState = {
                ...state,
                items: state.items.filter((_, index) => index !== action.payload)
            };
            break;
            
        case 'UPDATE_QUANTITY':
            const { itemIndex, newQuantity } = action.payload;
            if (newQuantity <= 0) {
                newState = {
                    ...state,
                    items: state.items.filter((_, index) => index !== itemIndex)
                };
            } else {
                const updatedItems = [...state.items];
                updatedItems[itemIndex].quantity = newQuantity;
                newState = { ...state, items: updatedItems };
            }
            break;
            
        case 'UPDATE_ATTRIBUTES':
            const { itemIndex: updateIndex, attributeId, itemId } = action.payload;
            const itemsToUpdate = [...state.items];
            itemsToUpdate[updateIndex].selectedAttributes = {
                ...itemsToUpdate[updateIndex].selectedAttributes,
                [attributeId]: itemId
            };
            newState = { ...state, items: itemsToUpdate };
            break;
            
        case 'CLEAR_CART':
            newState = { ...state, items: [] };
            break;
            
        case 'LOAD_CART':
            newState = { ...state, items: action.payload.items || [] };
            break;
            
        default:
            return state;
    }
    
    // Save to local storage after every state change
    if (newState) {
        saveCartToStorage(newState);
        return newState;
    }
    
    return state;
};

export const CartProvider = ({ children, onOpenCart }) => {
    const [state, dispatch] = useReducer(cartReducer, { items: [] });

    // Load cart from local storage on component mount
    useEffect(() => {
        const savedCart = loadCartFromStorage();
        if (savedCart.items && savedCart.items.length > 0) {
            dispatch({ type: 'LOAD_CART', payload: savedCart });
        }
    }, []);

    const addToCart = (product) => {
        dispatch({ type: 'ADD_TO_CART', payload: product });
        if (typeof onOpenCart === 'function') {
            onOpenCart();
        }
    };

    const removeFromCart = (itemIndex) => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: itemIndex });
    };

    const updateQuantity = (itemIndex, newQuantity) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { itemIndex, newQuantity } });
    };

    const updateAttributes = (itemIndex, attributeId, itemId) => {
        dispatch({ type: 'UPDATE_ATTRIBUTES', payload: { itemIndex, attributeId, itemId } });
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
    };

    const getTotalItems = () => {
        return state.items.reduce((total, item) => total + item.quantity, 0);
    };

    const getTotalPrice = () => {
        return state.items.reduce((total, item) => {
            const price = item.prices && item.prices[0] ? item.prices[0].amount : 0;
            return total + (price * item.quantity);
        }, 0);
    };

    const value = {
        items: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateAttributes,
        clearCart,
        getTotalItems,
        getTotalPrice
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
