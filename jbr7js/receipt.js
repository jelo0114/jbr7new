// receipt.js - FIXED VERSION with Supabase Receipt Fetching
(function(){
  function fmt(n){ return '₱' + Number(n).toFixed(2); }

  // Get orderId from URL if coming from order history
  const urlParams = new URLSearchParams(window.location.search);
  const orderIdFromUrl = urlParams.get('orderId');
  const orderNumberFromUrl = urlParams.get('orderNumber');

  // Check if we should fetch from Supabase (order history) or use pendingCheckout (new order)
  if (orderIdFromUrl || orderNumberFromUrl) {
    // Fetch from Supabase
    fetchReceiptFromSupabase(orderIdFromUrl, orderNumberFromUrl);
  } else {
    // Use pendingCheckout (new order just placed)
    loadFromPendingCheckout();
  }

  // ===============================================
  // FETCH RECEIPT FROM SUPABASE (for order history)
  // ===============================================
  async function fetchReceiptFromSupabase(orderId, orderNumber) {
    console.log('Fetching receipt from Supabase...', { orderId, orderNumber });
    
    const userId = sessionStorage.getItem('jbr7_user_id');
    if (!userId) {
      console.error('No user ID found');
      alert('Please log in to view receipts');
      window.location.href = 'login.html';
      return;
    }

    try {
      // Try to fetch receipt by orderId or orderNumber
      let url;
      if (orderId) {
        url = `/api/receipts?orderId=${orderId}`;
      } else if (orderNumber) {
        url = `/api/receipts?orderNumber=${orderNumber}`;
      } else {
        throw new Error('No order ID or order number provided');
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Receipt API response:', result);

      if (!result.success || !result.data || result.data.length === 0) {
        throw new Error('Receipt not found');
      }

      // Get the receipt data
      const receiptData = result.data[0];
      
      // Parse raw_response if it's a string
      let parsedReceipt;
      if (typeof receiptData.raw_response === 'string') {
        parsedReceipt = JSON.parse(receiptData.raw_response);
      } else {
        parsedReceipt = receiptData.raw_response || receiptData;
      }

      // Fetch order details to get items
      const orderResponse = await fetch(`/api/orders?orderId=${receiptData.order_id}`, {
        method: 'GET',
        credentials: 'same-origin'
      });

      let orderItems = [];
      if (orderResponse.ok) {
        const orderResult = await orderResponse.json();
        if (orderResult.success && orderResult.data && orderResult.data.length > 0) {
          const orderData = orderResult.data[0];
          orderItems = orderData.order_items || [];
        }
      }

      // Build receipt data structure (total = discounted total when coupon was used)
      const data = {
        orderId: receiptData.order_number || parsedReceipt.orderId,
        orderNumber: receiptData.order_number || parsedReceipt.orderNumber,
        timestamp: receiptData.captured_at || parsedReceipt.timestamp,
        payment: parsedReceipt.payment || receiptData.payment_provider,
        courier: parsedReceipt.courier,
        customerEmail: parsedReceipt.customerEmail,
        customerPhone: parsedReceipt.customerPhone,
        shippingAddress: parsedReceipt.shippingAddress,
        items: orderItems.length > 0 ? orderItems.map(item => ({
          name: item.item_name,
          image: item.item_image,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          unitPrice: parseFloat(item.item_price) || 0,
          lineTotal: parseFloat(item.line_total) || 0
        })) : (parsedReceipt.items || []),
        subtotal: parseFloat(parsedReceipt.subtotal) || parseFloat(receiptData.amount) || 0,
        shipping: parseFloat(parsedReceipt.shipping) || 0,
        discount: parseFloat(parsedReceipt.discount) || 0,
        total: parseFloat(receiptData.amount) || parseFloat(parsedReceipt.total) || 0
      };

      console.log('Rendering receipt from Supabase:', data);
      renderReceipt(data);

    } catch (error) {
      console.error('Error fetching receipt from Supabase:', error);
      alert('Failed to load receipt: ' + error.message);
      window.location.href = 'orders.html';
    }
  }

  // ===============================================
  // LOAD FROM PENDING CHECKOUT (new orders)
  // ===============================================
  function loadFromPendingCheckout() {
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
      console.log('Receipt data loaded from pendingCheckout:', data);
    } catch(e) {
      console.error('Failed to parse pendingCheckout:', e);
      alert('Error loading receipt data. Redirecting to cart...');
      window.location.href = 'cart.html';
      return;
    }

    renderReceipt(data);
    
    // Save receipt to database in background
    saveReceiptToDatabase(data);
  }

  // ===============================================
  // RENDER RECEIPT
  // ===============================================
  function renderReceipt(data) {
    // Populate order info
    document.getElementById('orderId').textContent = 'Order ID: ' + (data.orderId || data.orderNumber || 'N/A');
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
        else if (typeof clone.item_price !== 'undefined') clone.unitPrice = Number(clone.item_price) || 0;
        else if (typeof clone.basePrice !== 'undefined') clone.unitPrice = Number(clone.basePrice) || 0;
        else clone.unitPrice = 0;
      }
      clone.quantity = Number(clone.quantity || clone.qty || 1) || 1;
      if (typeof clone.lineTotal === 'undefined' || !clone.lineTotal) {
        if (typeof clone.line_total !== 'undefined') {
          clone.lineTotal = Number(clone.line_total);
        } else {
          clone.lineTotal = +(clone.unitPrice * clone.quantity).toFixed(2);
        }
      }
      // Normalize name field
      if (!clone.name && clone.item_name) clone.name = clone.item_name;
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

    // Populate totals (use discounted total when coupon was applied)
    let subtotalVal = (typeof data.subtotal !== 'undefined' && data.subtotal) ? Number(data.subtotal) : null;
    let shippingVal = (typeof data.shipping !== 'undefined') ? Number(data.shipping) : null;
    const discountVal = (typeof data.discount !== 'undefined' && data.discount != null) ? Number(data.discount) : 0;

    if (subtotalVal === null || subtotalVal === 0) {
      subtotalVal = items.reduce((s,it)=> s + (Number(it.lineTotal) || 0), 0);
    }
    if (shippingVal === null) {
      shippingVal = subtotalVal > 50 ? 0 : 5.99;
    }

    let totalVal;
    if (typeof data.total !== 'undefined' && data.total != null && data.total !== '') {
      totalVal = Number(data.total);
    } else {
      totalVal = +(subtotalVal + shippingVal - discountVal).toFixed(2);
    }

    document.getElementById('subtotal').textContent = fmt(subtotalVal || 0);
    document.getElementById('shipping').textContent = (shippingVal === 0) ? 'FREE' : fmt(shippingVal || 0);
    const discountRow = document.getElementById('discount-row');
    const discountEl = document.getElementById('discount');
    if (discountRow && discountEl) {
      if (discountVal > 0) {
        discountRow.style.display = 'flex';
        discountEl.textContent = '-' + fmt(discountVal);
      } else {
        discountRow.style.display = 'none';
      }
    }
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
      const shippingAddressEl = document.getElementById('shippingAddress');
      if (shippingAddressEl) {
        shippingAddressEl.innerHTML = '<div style="color:#999;font-style:italic">No shipping address provided</div>';
      }
    }
  }

  // Back button
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', ()=>{ 
      window.location.href = 'explore.html'; 
    });
  }

  function escapeHtml(s){ 
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
  }

  // ===============================================
  // SAVE RECEIPT TO DATABASE (background task)
  // ===============================================
  async function saveReceiptToDatabase(receiptData) {
    console.log('Attempting to save receipt to database...', receiptData);
    
    const userId = sessionStorage.getItem('jbr7_user_id');
    if (!userId) {
      console.warn('No user ID found, skipping receipt save');
      saveToLocalStorage(receiptData);
      return;
    }
    
    // Supabase API payload
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
    
    const endpoints = [
      { url: '/api/receipts', body: receiptPayload },
      { url: '/api/receipt', body: receiptPayload }
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
              console.log('✅ Receipt saved successfully via', endpoint);
              saved = true;
              break;
            }
          }
        }
        // Try next endpoint
        if (!response || !response.ok) continue;
      } catch (error) {
        // Try next endpoint
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