import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import Cart from './Cart';
import './Header.css';

function Header({ selectedCategory, onCategoryChange, isCartOpen, onOpenCart, onCloseCart }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [internalCartOpen, setInternalCartOpen] = useState(false);
    const navigate = useNavigate();
    const { getTotalItems } = useCart();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/database-viewer');
            const data = await response.json();
            
            if (data.success) {
                const categoriesTable = data.databaseInfo.find(table => table.tableName === 'categories');
                if (categoriesTable && categoriesTable.data) {
                    const categoryNames = categoriesTable.data.map(cat => cat.name);
                    // Ensure 'all' category exists as first item for tests and UX
                    const withAll = ['all', ...categoryNames.filter(c => c !== 'all')];
                    setCategories(withAll);
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            setCategories(['all', 'clothes', 'tech']);
            setLoading(false);
        }
    };

    const handleCategoryClick = (category) => {
        onCategoryChange(category);
        navigate('/'); // Navigate back to main page
    };

    // Keep internal state in sync if parent controls it
    useEffect(() => {
        if (typeof isCartOpen === 'boolean') {
            setInternalCartOpen(isCartOpen);
        }
    }, [isCartOpen]);

    const toggleCart = () => {
        if (onOpenCart && onCloseCart) {
            isCartOpen ? onCloseCart() : onOpenCart();
        } else {
            setInternalCartOpen(!internalCartOpen);
        }
    };

    const closeCart = () => {
        if (onCloseCart) onCloseCart();
        setInternalCartOpen(false);
    };

    if (loading) {
        return <div className="header-loading">Loading...</div>;
    }

    return (
        <>
            <header className="header">
                {/* Surface */}
                <div className="header__surface">
                    {/* Navigation - Left Side */}
                    <nav className="header__navigation">
                        <div className="header__nav-container">
                            {categories.map((category) => (
                                <a
                                    key={category}
                                    href={`/${category}`}
                                    className={`header__nav-button ${selectedCategory === category ? 'header__nav-button--active' : ''}`}
                                    onClick={(e) => { e.preventDefault(); handleCategoryClick(category); }}
                                    data-testid={selectedCategory === category ? 'active-category-link' : 'category-link'}
                                >
                                    <div className="header__nav-label">
                                        <span className={`header__nav-text ${selectedCategory === category ? 'header__nav-text--active' : ''}`}>
                                            {category.toUpperCase()}
                                        </span>
                                        <div className={`header__nav-border ${selectedCategory === category ? 'header__nav-border--active' : ''}`}></div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </nav>

                    {/* Logo - Center */}
                    <div className="header__logo" onClick={() => navigate('/')}>
                        <img src="/logo transparent.png" alt="VSF Logo" className="header__logo-image" />
                    </div>

                    {/* Actions - Right Side */}
                    <div className="header__actions">
                        <div className="header__cart-icon" onClick={toggleCart} data-testid="cart-btn">
                            <img src="/Empty Cart.svg" alt="Shopping Cart" className="header__cart-image" />
                            {getTotalItems() > 0 && (
                                <div className="header__cart-badge">
                                    <span className="header__cart-badge-text">{getTotalItems()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Cart Component */}
            <Cart isOpen={typeof isCartOpen === 'boolean' ? isCartOpen : internalCartOpen} onClose={closeCart} />
        </>
    );
}

export default Header; 