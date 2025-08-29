import {BrowserRouter, Routes, Route} from 'react-router-dom';
import { useState } from 'react';
import './App.css';

import DatabaseViewer from './components/DatabaseViewer';
import MainPage from './components/MainPage';
import ItemPage from './components/ItemPage';
import Header from './components/Header';
import { CartProvider } from './contexts/CartContext';

function App() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartProvider onOpenCart={openCart}>
      <div className="App">
        <BrowserRouter>
          <Header 
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            isCartOpen={isCartOpen}
            onOpenCart={openCart}
            onCloseCart={closeCart}
          />
          <main className="main-content">
            <Routes>
              <Route index element={<MainPage selectedCategory={selectedCategory} />} />
              <Route path="product/:productId" element={<ItemPage />} />
              <Route path="database-viewer" element={<DatabaseViewer />} />
            </Routes>
          </main>
        </BrowserRouter>
      </div>
    </CartProvider>
  );
}

export default App;
