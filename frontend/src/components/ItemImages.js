import React, { useState } from "react";
import "./ItemImages.css";

function ItemImages({ product }) {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    
    const hasGallery = product && product.gallery && product.gallery.length > 0;
    const images = hasGallery ? product.gallery : [];
    const fallbackImage = "https://via.placeholder.com/610x511?text=No+Image";
    
    const handleThumbnailClick = (index) => {
        setSelectedImageIndex(index);
    };

    const handlePrevImage = () => {
        setSelectedImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
    };

    const handleNextImage = () => {
        setSelectedImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
    };

    if (!hasGallery) {
        return (
            <div className="item-images">
                <div className="item-images__thumbnails">
                    <div className="item-images__thumbnail item-images__thumbnail--active">
                        <img src={fallbackImage} alt="Product" />
                    </div>
                </div>
                <div className="item-images__main">
                    <img src={fallbackImage} alt="Product" className="item-images__main-image" />
                </div>
            </div>
        );
    }

    return (
        <div className="item-images" data-testid="product-gallery">
            {/* Thumbnail Images on the Left */}
            <div className="item-images__thumbnails">
                {images.map((image, index) => (
                    <div 
                        key={index}
                        className={`item-images__thumbnail ${selectedImageIndex === index ? 'item-images__thumbnail--active' : ''}`}
                        onClick={() => handleThumbnailClick(index)}
                    >
                        <img src={image} alt={`Product ${index + 1}`} />
                    </div>
                ))}
            </div>
            
            {/* Main Image Display */}
            <div className="item-images__main">
                {images.length > 1 && (
                    <button 
                        className="item-images__arrow item-images__arrow--left"
                        onClick={handlePrevImage}
                        aria-label="Previous image"
                    >
                        <svg className="item-images__arrow-icon item-images__arrow-icon--left" width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 5.09158L16.5 12.5836L9 20.0757" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                )}
                <img 
                    src={images[selectedImageIndex]} 
                    alt={`Product ${selectedImageIndex + 1}`}
                    className="item-images__main-image"
                />
                {images.length > 1 && (
                    <button 
                        className="item-images__arrow item-images__arrow--right"
                        onClick={handleNextImage}
                        aria-label="Next image"
                    >
                        <svg className="item-images__arrow-icon" width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 5.09158L16.5 12.5836L9 20.0757" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

export default ItemImages; 