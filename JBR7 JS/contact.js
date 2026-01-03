// Contact Page Functionality

// FAQ Data
const faqs = [
    {
        question: 'How do I place a custom order?',
        answer: 'You can place a custom order by browsing our products and selecting the "Customize" option. Choose your preferred colors, add your logo or design, select materials, and submit your order. Our team will contact you within 24 hours to confirm the details and provide a quote.'
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept major credit cards (Visa, Mastercard, American Express), debit cards, PayPal, bank transfers, and cash on delivery for local orders. For bulk orders, we also offer flexible payment terms and installment options.'
    },
    {
        question: 'How long does shipping take?',
        answer: 'Standard orders ship within 3-5 business days. Custom orders typically take 7-14 business days depending on complexity. Express shipping is available for an additional fee. You will receive tracking information once your order ships.'
    },
    {
        question: 'What are your minimum order quantities?',
        answer: 'For standard products, there is no minimum order quantity - you can order as few as 1 bag. For custom orders with logo printing or special designs, the minimum order is typically 50 units, but we can accommodate smaller quantities for an additional setup fee.'
    },
    {
        question: 'Can I return or exchange my order?',
        answer: 'Yes! We offer a 30-day return policy for standard products in unused condition with original tags. Custom orders can only be returned if there is a manufacturing defect. Contact our customer service team to initiate a return and receive a prepaid shipping label.'
    },
    {
        question: 'How do I track my order?',
        answer: 'Once your order ships, you will receive an email with tracking information. You can also track your order by logging into your account and visiting the "My Orders" section. Our customer service team is available to help with any tracking questions.'
    },
    {
        question: 'What customization options are available?',
        answer: 'We offer logo printing (screen print, embroidery, heat transfer), custom colors, material selection (canvas, jute, leather, nylon), size adjustments, custom pockets and compartments, and special hardware. Contact us to discuss your specific requirements.'
    },
    {
        question: 'Do you offer bulk discounts?',
        answer: 'Yes! We offer tiered pricing for bulk orders: 10% off for 100+ units, 15% off for 500+ units, and 20% off for 1000+ units. Contact our sales team for a custom quote on large orders or corporate partnerships.'
    },
    {
        question: 'Are your bags eco-friendly?',
        answer: 'Yes! We prioritize sustainability with recycled materials, organic cotton, biodegradable jute, and eco-friendly dyes. Many of our products are certified by environmental standards. We also use minimal, recyclable packaging for all shipments.'
    },
    {
        question: 'What if I receive a defective product?',
        answer: 'We stand behind the quality of our products. If you receive a defective item, contact us immediately with photos. We will send a replacement at no cost or issue a full refund. Defective items do not need to be returned unless requested.'
    },
    {
        question: 'Can I see a sample before ordering in bulk?',
        answer: 'Absolutely! We offer sample products for evaluation. For custom orders, we can provide a sample with your design for a small fee, which is refunded when you place your bulk order. This ensures you are completely satisfied before committing to a large quantity.'
    },
    {
        question: 'How do I submit my logo or design?',
    answer: 'You can upload your logo during the customization process or email it to roquejennylynbatac@gmail.com. We accept AI, EPS, PDF, PNG (high resolution), and JPG files. Our design team will review your file and may request a vector format for best print quality.'
    }
];

let expandedFaq = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    renderFaqs();
});

// Render FAQ items
function renderFaqs() {
    const faqList = document.getElementById('faqList');
    
    faqList.innerHTML = faqs.map((faq, index) => `
        <div class="contact-faq-item">
            <button class="faq-question-btn" onclick="toggleFaq(${index})">
                <span class="faq-question-text">${faq.question}</span>
                <span class="faq-toggle-icon">
                    <i class="fas fa-plus"></i>
                </span>
            </button>
            <div class="faq-answer" id="faq-answer-${index}" style="display: none;">
                ${faq.answer}
            </div>
        </div>
    `).join('');
}

// Toggle FAQ expand/collapse
function toggleFaq(index) {
    const answer = document.getElementById(`faq-answer-${index}`);
    const allAnswers = document.querySelectorAll('.faq-answer');
    const allButtons = document.querySelectorAll('.faq-question-btn');
    const allIcons = document.querySelectorAll('.faq-toggle-icon i');
    
    // Close all other FAQs
    allAnswers.forEach((ans, i) => {
        if (i !== index) {
            ans.style.display = 'none';
            allButtons[i].classList.remove('active');
            allIcons[i].className = 'fas fa-plus';
        }
    });
    
    // Toggle current FAQ
    if (answer.style.display === 'none') {
        answer.style.display = 'block';
        allButtons[index].classList.add('active');
        allIcons[index].className = 'fas fa-minus';
        expandedFaq = index;
    } else {
        answer.style.display = 'none';
        allButtons[index].classList.remove('active');
        allIcons[index].className = 'fas fa-plus';
        expandedFaq = null;
    }
}

// Filter FAQs based on search
function filterFaqs() {
    const searchQuery = document.getElementById('searchQuery').value.toLowerCase();
    const faqList = document.getElementById('faqList');
    const noResults = document.getElementById('noResults');
    
    const filteredFaqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery) ||
        faq.answer.toLowerCase().includes(searchQuery)
    );
    
    if (filteredFaqs.length === 0) {
        faqList.innerHTML = '';
        noResults.style.display = 'block';
        noResults.querySelector('p').textContent = `No results found for "${searchQuery}"`;
    } else {
        noResults.style.display = 'none';
        faqList.innerHTML = filteredFaqs.map((faq, index) => {
            const originalIndex = faqs.indexOf(faq);
            return `
                <div class="contact-faq-item">
                    <button class="faq-question-btn" onclick="toggleFaq(${originalIndex})">
                        <span class="faq-question-text">${faq.question}</span>
                        <span class="faq-toggle-icon">
                            <i class="fas fa-plus"></i>
                        </span>
                    </button>
                    <div class="faq-answer" id="faq-answer-${originalIndex}" style="display: none;">
                        ${faq.answer}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Open customer service (you can customize this)
function openCustomerService() {
    showNotification('Connecting you to customer service...', 'success');
    
    // You could open a chat widget, redirect to a support page, or open a modal
    setTimeout(() => {
    alert('Customer Service\n\nOur team is ready to help!\n\nPhone: 09216821649\nEmail: roquejennylynbatac@gmail.com\n\nOr use the live chat feature in the bottom right corner.');
    }, 500);
}

// Show notification
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add notification styles if not already present
if (!document.querySelector('#notification-styles')) {
    const notificationStyles = document.createElement('style');
    notificationStyles.id = 'notification-styles';
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            top: 100px;
            right: -400px;
            background-color: #fff;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 0.8rem;
            z-index: 10000;
            transition: right 0.3s ease;
            max-width: 350px;
        }
        
        .notification.show {
            right: 20px;
        }
        
        .notification i {
            font-size: 1.5rem;
        }
        
        .notification-success {
            border-left: 4px solid #006923;
        }
        
        .notification-success i {
            color: #006923;
        }
        
        .notification-info {
            border-left: 4px solid #3b5d72;
        }
        
        .notification-info i {
            color: #3b5d72;
        }
        
        .notification span {
            font-size: 0.95rem;
            color: #333;
            font-weight: 500;
        }
    `;
    document.head.appendChild(notificationStyles);
}

