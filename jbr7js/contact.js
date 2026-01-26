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

// Start Live Chat - Opens Facebook chat/message
function startLiveChat() {
    const facebookUrl = 'https://web.facebook.com/profile.php?id=61557774894148&rdid=6Um97esYK1zmLPMi&share_url=https%3A%2F%2Fweb.facebook.com%2Fshare%2F1CMB6249vF%2F%3F_rdc%3D1%26_rdr%23';
    window.open(facebookUrl, '_blank');
}

// Get Directions - Opens Google Maps with the address
function getDirections() {
    const address = '059 Purok 1, Culianin, Plaridel, Bulacan';
    // URL encode the address for Google Maps
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(mapsUrl, '_blank');
}

// AI-generated response function
function generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase().trim();
    
    // Greetings
    if (message.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
        return "Hello! 👋 Thank you for contacting JBR7 Bags Manufacturing. I am JBR7 AI and I am here to help you with any questions about our products, orders, or services. What would you like to know?";
    }
    
    // Price inquiries
    if (message.match(/(price|cost|how much|pricing|afford|expensive)/)) {
        return "Our prices vary depending on the product type, size, quantity, and customization options. Standard bags start from ₱55, while custom orders with logos start from ₱70. For bulk orders (100+ units), we offer discounts up to 20%. Would you like a specific quote?";
    }
    
    // Order inquiries
    if (message.match(/(order|buy|purchase|how to order|place order|order process)/)) {
        return "To place an order, you can browse our products on the Explore page, customize your bag with your preferred design, colors, and logo, then add to cart. For bulk or custom orders, you can also email us at roquejennylynbatac@gmail.com. We'll confirm your order details within 24 hours!";
    }
    
    // Shipping inquiries
    if (message.match(/(shipping|delivery|how long|when will|deliver|arrive)/)) {
        return "Standard orders ship within 3-5 business days. Custom orders typically take 7-14 business days depending on complexity. Express shipping is available for an additional fee. You'll receive tracking information once your order ships!";
    }
    
    // Payment inquiries
    if (message.match(/(payment|pay|credit card|cash|method|how to pay)/)) {
        return "We accept major credit cards (Visa, Mastercard, American Express), debit cards, PayPal, bank transfers, and cash on delivery for local orders. For bulk orders, we also offer flexible payment terms and installment options.";
    }
    
    // Customization inquiries
    if (message.match(/(custom|customize|logo|design|personalize|colors|material)/)) {
        return "Yes! We offer extensive customization options including logo printing (screen print, embroidery, heat transfer), custom colors, material selection (canvas, jute, leather, nylon), size adjustments, custom pockets, and special hardware. For custom orders, minimum quantity is 50 units. Contact us for more details!";
    }
    
    // Return/Refund inquiries
    if (message.match(/(return|refund|exchange|wrong|defective|broken)/)) {
        return "We offer a 30-day return policy for standard products in unused condition with original tags. Custom orders can only be returned if there is a manufacturing defect. Defective items are replaced or refunded at no cost. Contact us immediately with photos if you have any issues!";
    }
    
    // Contact information
    if (message.match(/(contact|email|phone|number|reach|talk to)/)) {
        return "You can reach us via:\n📧 Email: roquejennylynbatac@gmail.com\n📱 Phone: 09216821649 (Mon-Fri: 9AM - 6PM)\n📍 Address: 059 Purok 1, Culianin, Plaridel, Bulacan\n💬 Facebook: Visit our page for instant messaging";
    }
    
    // Product information
    if (message.match(/(product|bag|what do you have|types|varieties|available)/)) {
        return "We offer various bag types including:\n• Tote Bags (Eco Colored, White, Black)\n• Backpacks (Plain, Two Colors, Katrina series)\n• Module Bags\n• Envelope Bags\n• Riki, Vanity, and Ringlight Bags\n• Kiddie Bags (Boys & Girls)\nBrowse our Explore page to see all products!";
    }
    
    // Bulk orders
    if (message.match(/(bulk|wholesale|minimum|quantity|discount|corporate)/)) {
        return "For bulk orders, we offer tiered pricing:\n• 10% off for 100+ units\n• 15% off for 500+ units\n• 20% off for 1000+ units\nCustom orders with logos have a minimum of 50 units. We can accommodate smaller quantities for an additional setup fee. Contact us for a custom quote!";
    }
    
    // Samples
    if (message.match(/(sample|preview|see before|trial|test)/)) {
        return "Yes! We offer sample products for evaluation. For custom orders, we can provide a sample with your design for a small fee, which is refunded when you place your bulk order. This ensures you are completely satisfied before committing to a large quantity.";
    }
    
    // Default/fallback response
    if (message.match(/(thank|thanks|appreciate|great|ok|okay|sure)/)) {
        return "You are welcome! Is there anything else I can help you with? Feel free to ask about our products, orders, shipping, or customization options.";
    }
    
    // If no match, provide helpful response
    return "I am JBR7 AI! Our team specializes in custom bag manufacturing. I can assist you with:\n• Product information and pricing\n• Customization options\n• Order placement\n• Shipping and delivery\n• Returns and refunds\n• Bulk order discounts\n\nWhat specific information do you need? For complex inquiries, you can also email us at roquejennylynbatac@gmail.com or call 09216821649.";
}

// Open customer service chat - Opens the local messages panel (same as header messages icon)
function openCustomerServiceChat() {
    // Open the messages panel (same as clicking the messages icon in header)
    if (window.JBR7Messenger && typeof window.JBR7Messenger.openPanel === 'function') {
        window.JBR7Messenger.openPanel();
    } else if (window.JBR7Messenger && typeof window.JBR7Messenger.togglePanel === 'function') {
        window.JBR7Messenger.togglePanel();
    } else {
        // Fallback: show notification if messages panel is not available
        showNotification('Messages feature is loading...', 'info');
    }
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

