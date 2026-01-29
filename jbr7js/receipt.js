// receipt.js - FALLBACK VERSION with multiple endpoint attempts
(function(){
  function fmt(n){ return '₱' + Number(n).toFixed(2); }

  // Check if pendingCheckout exists
  const raw = localStorage.getItem('pendingCheckout');
  
  if (!raw) {
    console.error('No pendingCheckout data found in localStorage');
    alert('No receipt data found. Redirecting to cart...');
    window.location.href = 'cart.html';
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
    console.log('Receipt data loaded:', data);
  } catch(e) {
    console.error('Failed to parse pendingCheckout:', e);
    alert('Error loading receipt data. Redirecting to cart...');
    window.location.href = 'cart.html';
    return;
  }

  // Populate order info
  document.getElementById('orderId').textContent = 'Order ID: ' + (data.orderId || 'N/A');
  document.getElementById('orderDate').textContent = 'Date: ' + (data.timestamp ? new Date(data.timestamp).toLocaleString() : new Date().toLocaleString());
  document.getElementById('payment').textContent = 'Payment: ' + (data.payment || 'Not specified');
  document.getElementById('courier').textContent = 'Courier: ' + (data.courier || 'Not specified');

  // Populate items table
  const tbody = document.querySelector('#itemsTable tbody');
  tbody.innerHTML = '';
  
  let items = data.items || [];
  console.log('Rendering items (raw):', items);

  // Normalize items
  items = (items || []).map(it => {
    const clone = Object.assign({}, it);
    if (typeof clone.unitPrice === 'undefined') {
      if (typeof clone.price !== 'undefined') clone.unitPrice = parseFloat(String(clone.price).toString().replace(/[^0-9\.-]/g, '')) || 0;
      else if (typeof clone.basePrice !== 'undefined') clone.unitPrice = Number(clone.basePrice) || 0;
      else clone.unitPrice = 0;
    }
    clone.quantity = Number(clone.quantity || clone.qty || 1) || 1;
    if (typeof clone.lineTotal === 'undefined' || !clone.lineTotal) {
      clone.lineTotal = +(clone.unitPrice * clone.quantity).toFixed(2);
    }
    return clone;
  });

  console.log('Rendering items (normalized):', items);

  if (items.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No items in this order';
    td.style.textAlign = 'center';
    td.style.color = '#999';
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    items.forEach(it => {
      const tr = document.createElement('tr');
      
      // Item name column with optional size/color
      const tdName = document.createElement('td');
      let itemDetails = `<div style="font-weight:700">${escapeHtml(it.name || 'Unknown Item')}</div>`;
      if (it.size || it.color) {
        let subtext = [];
        if (it.size) subtext.push('Size: ' + escapeHtml(it.size));
        if (it.color) subtext.push('Color: ' + escapeHtml(it.color));
        itemDetails += `<div style="font-size:0.9rem;color:#666">${subtext.join(' • ')}</div>`;
      }
      tdName.innerHTML = itemDetails;
      
      // Unit price
      const tdUnit = document.createElement('td');
      tdUnit.className = 'right';
      tdUnit.textContent = fmt(it.unitPrice || it.price || 0);
      
      // Quantity
      const tdQty = document.createElement('td');
      tdQty.className = 'right';
      tdQty.textContent = it.quantity || 1;
      
      // Line total
      const tdLine = document.createElement('td');
      tdLine.className = 'right';
      tdLine.textContent = fmt(it.lineTotal || ((it.unitPrice || it.price || 0) * (it.quantity || 1)));
      
      tr.appendChild(tdName);
      tr.appendChild(tdUnit);
      tr.appendChild(tdQty);
      tr.appendChild(tdLine);
      tbody.appendChild(tr);
    });
  }

  // Populate totals
  let subtotalVal = (typeof data.subtotal !== 'undefined' && data.subtotal) ? Number(data.subtotal) : null;
  let shippingVal = (typeof data.shipping !== 'undefined') ? Number(data.shipping) : null;

  if (subtotalVal === null || subtotalVal === 0) {
    subtotalVal = items.reduce((s,it)=> s + (Number(it.lineTotal) || 0), 0);
  }
  if (shippingVal === null) {
    shippingVal = subtotalVal > 50 ? 0 : 5.99;
  }
  
  let totalVal = +(subtotalVal + shippingVal).toFixed(2);

  document.getElementById('subtotal').textContent = fmt(subtotalVal || 0);
  document.getElementById('shipping').textContent = (shippingVal === 0) ? 'FREE' : fmt(shippingVal || 0);
  document.getElementById('total').textContent = fmt(totalVal || 0);

  // Customer info
  const cust = [];
  if (data.customerEmail) cust.push(data.customerEmail);
  if (data.customerPhone) cust.push(data.customerPhone);
  document.getElementById('custContact').textContent = cust.join(' • ') || '—';

  // Shipping Address
  if (data.shippingAddress) {
    const addr = data.shippingAddress;
    if (addr.full_name) document.getElementById('shippingName').textContent = addr.full_name;
    if (addr.phone) document.getElementById('shippingPhone').textContent = 'Phone: ' + addr.phone;
    if (addr.address_line1) document.getElementById('shippingAddressLine1').textContent = addr.address_line1;
    if (addr.address_line2) document.getElementById('shippingAddressLine2').textContent = addr.address_line2;
    const cityProvince = [];
    if (addr.city) cityProvince.push(addr.city);
    if (addr.province) cityProvince.push(addr.province);
    if (cityProvince.length > 0) document.getElementById('shippingCityProvince').textContent = cityProvince.join(', ');
    if (addr.postal_code) document.getElementById('shippingPostalCode').textContent = addr.postal_code;
    if (addr.country) document.getElementById('shippingCountry').textContent = addr.country;
  } else {
    document.getElementById('shippingAddress').innerHTML = '<div style="color:#999;font-style:italic">No shipping address provided</div>';
  }

  // Save receipt to database (with fallback)
  saveReceiptToDatabase(data);

  // Back button
  document.getElementById('backBtn').addEventListener('click', ()=>{ 
    window.location.href = 'explore.html'; 
  });

  function escapeHtml(s){ 
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
  }

  // IMPROVED: Try multiple endpoints with fallback
  async function saveReceiptToDatabase(receiptData) {
    console.log('Attempting to save receipt to database...', receiptData);
    
    const userId = sessionStorage.getItem('jbr7_user_id');
    if (!userId) {
      console.warn('No user ID found, skipping receipt save');
      saveToLocalStorage(receiptData);
      return;
    }
    
    // Payload for /api/receipts or /api/receipt (Supabase-style)
    const receiptPayload = {
      userId: parseInt(userId),
      receiptData: {
        orderId: receiptData.orderId,
        orderNumber: receiptData.orderNumber || receiptData.orderId,
        amount: receiptData.total,
        currency: 'PHP',
        status: 'succeeded',
        payment_provider: receiptData.payment,
        captured_at: receiptData.timestamp,
        raw_response: receiptData
      }
    };

    // Payload for /jbr7php/receipt.php (flat keys, session auth)
    const phpReceiptPayload = {
      orderId: receiptData.orderId || receiptData.orderNumber,
      orderNumber: receiptData.orderNumber || receiptData.orderId,
      total: receiptData.total,
      subtotal: receiptData.subtotal,
      shipping: receiptData.shipping,
      payment: receiptData.payment,
      courier: receiptData.courier,
      customerEmail: receiptData.customerEmail,
      customerPhone: receiptData.customerPhone,
      shippingAddress: receiptData.shippingAddress,
      timestamp: receiptData.timestamp
    };
    
    // Try /api/receipt first (Vercel serverless route name), then /api/receipts, then PHP
    const endpoints = [
      { url: '/api/receipt', body: receiptPayload },
      { url: '/api/receipts', body: receiptPayload },
      { url: '/jbr7php/receipt.php', body: phpReceiptPayload }
    ];
    
    let saved = false;
    
    for (const { url: endpoint, body } of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(body)
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await response.json();
            if (data.success) {
              console.log('Receipt saved successfully via', endpoint);
              saved = true;
              break;
            }
          }
        }
        // 404 / NOT_FOUND expected when API routes are not deployed — try next
        if (response.status === 404) continue;
      } catch (error) {
        // Network or parse error — try next endpoint (don't log 404 as error)
        if (error.message && !error.message.includes('404')) {
          console.warn('Receipt save attempt failed for', endpoint, error.message);
        }
        continue;
      }
    }
    
    if (!saved) {
      console.warn('⚠️ All endpoints failed, saving to localStorage as fallback');
      saveToLocalStorage(receiptData);
    }
  }
  
  // Save to localStorage as last resort
  function saveToLocalStorage(receiptData) {
    try {
      const receipts = JSON.parse(localStorage.getItem('savedReceipts') || '[]');
      receipts.push({
        ...receiptData,
        savedAt: new Date().toISOString(),
        source: 'localStorage_fallback'
      });
      localStorage.setItem('savedReceipts', JSON.stringify(receipts));
      console.log('📝 Receipt saved to localStorage as fallback');
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }
})();