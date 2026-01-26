// explore-ratings.js
// Fetches and displays ratings from database for explore.html

document.addEventListener('DOMContentLoaded', function() {
    // Fetch items with ratings from database
    fetch('/jbr7php/get_items.php', {
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success && data.items) {
            console.log('Fetched items from database:', data.items.length);
            console.log('Sample items:', data.items.slice(0, 3));
            updateProductRatings(data.items);
        } else {
            console.error('Failed to fetch items:', data);
        }
    })
    .catch(e => {
        console.error('Failed to fetch ratings:', e);
    });
});

function updateProductRatings(items) {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const titleEl = card.querySelector('h3');
        if (!titleEl) return;
        
        const productTitle = titleEl.textContent.trim();
        
        // Find matching item from database - try exact match first, then case-insensitive, then partial match
        let item = items.find(i => i.title === productTitle);
        
        if (!item) {
            // Try case-insensitive match
            item = items.find(i => i.title.toLowerCase() === productTitle.toLowerCase());
        }
        
        if (!item) {
            // Try partial match (product title contains item title or vice versa)
            item = items.find(i => 
                i.title.toLowerCase().includes(productTitle.toLowerCase()) || 
                productTitle.toLowerCase().includes(i.title.toLowerCase())
            );
        }
        
        if (!item) {
            console.log('No match found for product:', productTitle);
            return;
        }
        
        // Update rating display
        const ratingEl = card.querySelector('.rating-number');
        const reviewCountEl = card.querySelector('.review-count');
        const ratingPercentageEl = card.querySelector('.rating-percentage');
        const starsContainer = card.querySelector('.rating');
        
        if (ratingEl) {
            // Parse rating and ensure it's valid
            let rating = parseFloat(item.rating) || 0.0;
            
            // Clamp rating strictly between 0.0 and 5.0
            rating = Math.max(0.0, Math.min(5.0, rating));
            
            // Format rating to 1 decimal place, but don't show if it's 0
            if (rating === 0) {
                ratingEl.textContent = '0.0';
            } else {
                ratingEl.textContent = rating.toFixed(1);
            }
            
            card.setAttribute('data-rating', rating.toString());
        }
        
        // Update review count from database - ALWAYS update, even if 0
        if (reviewCountEl) {
            const count = parseInt(item.review_count) || 0;
            if (count === 0) {
                reviewCountEl.textContent = '(0 reviews)';
            } else if (count === 1) {
                reviewCountEl.textContent = '(1 review)';
            } else {
                reviewCountEl.textContent = `(${count} reviews)`;
            }
            console.log(`Updated review count for "${productTitle}": ${count}`);
        } else {
            console.warn(`Review count element not found for "${productTitle}"`);
        }
        
        // Get clamped rating for percentage and stars
        let clampedRating = parseFloat(item.rating) || 0.0;
        clampedRating = Math.max(0.0, Math.min(5.0, clampedRating));
        
        // Update rating percentage display
        if (ratingPercentageEl) {
            if (clampedRating > 0) {
                const percentage = ((clampedRating / 5) * 100).toFixed(0);
                ratingPercentageEl.textContent = `${percentage}%`;
                ratingPercentageEl.style.display = 'inline';
            } else {
                ratingPercentageEl.style.display = 'none';
            }
        }
        
        // Update star display
        if (starsContainer) {
            const stars = starsContainer.querySelectorAll('i');
            const fullStars = Math.floor(clampedRating);
            const hasHalfStar = (clampedRating % 1) >= 0.5;
            
            stars.forEach((star, index) => {
                if (index < fullStars) {
                    star.className = 'fas fa-star';
                } else if (index === fullStars && hasHalfStar) {
                    star.className = 'fas fa-star-half-alt';
                } else {
                    star.className = 'far fa-star';
                }
            });
        }
    });
}
