// explore-ratings.js
// Fetches real review count and average rating from Supabase (get_product_reviews) for each product on explore.html

document.addEventListener('DOMContentLoaded', function() {
    const productCards = document.querySelectorAll('.product-card');
    const fetchFn = typeof window.apiFetch === 'function' ? window.apiFetch : fetch;

    function updateCardWithSummary(card, productTitle, summary) {
        const total = summary && typeof summary.total === 'number' ? summary.total : 0;
        const average = summary && typeof summary.average === 'number' ? summary.average : 0;
        const clampedRating = Math.max(0, Math.min(5, average));

        const ratingEl = card.querySelector('.rating-number');
        const reviewCountEl = card.querySelector('.review-count');
        const ratingPercentageEl = card.querySelector('.rating-percentage');
        const starsContainer = card.querySelector('.rating');

        if (ratingEl) {
            ratingEl.textContent = average > 0 ? average.toFixed(1) : '0.0';
            card.setAttribute('data-rating', clampedRating.toString());
        }
        if (reviewCountEl) {
            if (total === 0) reviewCountEl.textContent = '(0 reviews)';
            else if (total === 1) reviewCountEl.textContent = '(1 review)';
            else reviewCountEl.textContent = '(' + total + ' reviews)';
            card.setAttribute('data-review-count', String(total));
        }
        if (ratingPercentageEl) {
            if (clampedRating > 0) {
                ratingPercentageEl.textContent = Math.round((clampedRating / 5) * 100) + '%';
                ratingPercentageEl.style.display = 'inline';
            } else {
                ratingPercentageEl.style.display = 'none';
            }
        }
        if (starsContainer) {
            const stars = starsContainer.querySelectorAll('i');
            const fullStars = Math.floor(clampedRating);
            const hasHalfStar = (clampedRating % 1) >= 0.5;
            stars.forEach(function(star, index) {
                if (index < fullStars) star.className = 'fas fa-star';
                else if (index === fullStars && hasHalfStar) star.className = 'fas fa-star-half-alt';
                else star.className = 'far fa-star';
            });
        }
    }

    function fetchReviewsForCard(card) {
        const titleEl = card.querySelector('h3');
        if (!titleEl) return Promise.resolve();
        const productTitle = (titleEl.textContent || '').trim();
        if (!productTitle) return Promise.resolve();

        return fetchFn('/api/get_product_reviews?product=' + encodeURIComponent(productTitle), { credentials: 'same-origin' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var summary = (data && data.summary) ? data.summary : { total: 0, average: 0 };
                updateCardWithSummary(card, productTitle, summary);
            })
            .catch(function() {
                updateCardWithSummary(card, productTitle, { total: 0, average: 0 });
            });
    }

    var promises = [];
    productCards.forEach(function(card) {
        promises.push(fetchReviewsForCard(card));
    });
    Promise.all(promises).catch(function(e) {
        console.error('Explore ratings fetch error:', e);
    });
});
