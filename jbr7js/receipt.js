// receipt.js - fetch receipt from database or localStorage and render professional receipt
(function(){
  function fmt(n){ return '₱' + Number(n).toFixed(2); }
  function escapeHtml(s){ 
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
  }

  // Get order number from URL parameters
  function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  const orderNumberFromUrl = getUrlParam('order_number') || getUrlParam('order');
  let data = null;
  let isLoading = true;

  // Function to render receipt data
  function renderReceipt(receiptData) {
    if (!receiptData) {
      console.error('No receipt data to render');
      alert('No receipt data found. Redirecting to cart...');
      window.location.href = 'cart.html';
      return;
    }

    // Populate order info
    document.getElementById('orderId').textContent = 'Order ID: ' + (receiptData.orderId || receiptData.order_number || 'N/A');
    document.getElementById('orderDate').textContent = 'Date: ' + (receiptData.timestamp ? new Date(receiptData.timestamp).toLocaleString() : (receiptData.created_at ? new Date(receiptData.created_at).toLocaleString() : new Date().toLocaleString()));
    document.getElementById('payment').textContent = 'Payment: ' + (receiptData.payment || receiptData.payment_method || 'Not specified');
    document.getElementById('courier').textContent = 'Courier: ' + (receiptData.courier || receiptData.courier_service || 'Not specified');

    // Populate items table
    const tbody = document.querySelector('#itemsTable tbody');
    tbody.innerHTML = '';
    
    // Be defensive: some deployments may store slightly different keys (price vs unitPrice/basePrice)
    let items = receiptData.items || [];
    console.log('Rendering items (raw):', items);

    // Normalize each item so receipt can render even if the source used a different field name
    items = (items || []).map(it => {
      const clone = Object.assign({}, it);
      // try to coerce unitPrice from several possible fields
      if (typeof clone.unitPrice === 'undefined') {
        if (typeof clone.price !== 'undefined') clone.unitPrice = parseFloat(String(clone.price).toString().replace(/[^0-9\.-]/g, '')) || 0;
        else if (typeof clone.basePrice !== 'undefined') clone.unitPrice = Number(clone.basePrice) || 0;
        else clone.unitPrice = 0;
      }
      // quantity fallback
      clone.quantity = Number(clone.quantity || clone.qty || 1) || 1;
      // lineTotal fallback
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

    // Populate totals (NO TAX)
    // If totals are missing, compute from normalized items
    let subtotalVal = (typeof receiptData.subtotal !== 'undefined' && receiptData.subtotal) ? Number(receiptData.subtotal) : null;
    let shippingVal = (typeof receiptData.shipping !== 'undefined') ? Number(receiptData.shipping) : null;

    if (subtotalVal === null || subtotalVal === 0) {
      subtotalVal = items.reduce((s,it)=> s + (Number(it.lineTotal) || 0), 0);
    }
    if (shippingVal === null) {
      shippingVal = subtotalVal > 50 ? 0 : 5.99;
    }
    
    // ALWAYS recalculate total to ensure it's correct (subtotal + shipping only, no tax)
    let totalVal = +(subtotalVal + shippingVal).toFixed(2);

    document.getElementById('subtotal').textContent = fmt(subtotalVal || 0);
    document.getElementById('shipping').textContent = (shippingVal === 0) ? 'FREE' : fmt(shippingVal || 0);
    document.getElementById('total').textContent = fmt(totalVal || 0);

    // Customer info
    const cust = [];
    if (receiptData.customerEmail) cust.push(receiptData.customerEmail);
    if (receiptData.customerPhone) cust.push(receiptData.customerPhone);
    document.getElementById('custContact').textContent = cust.join(' • ') || '—';

    // Shipping Address - handle both shippingAddress and shipping_address field names
    const shippingAddr = receiptData.shippingAddress || receiptData.shipping_address;
    if (shippingAddr && (typeof shippingAddr === 'object' || typeof shippingAddr === 'string')) {
      // Handle if it's a JSON string
      let addr = shippingAddr;
      if (typeof shippingAddr === 'string') {
        try {
          addr = JSON.parse(shippingAddr);
        } catch (e) {
          console.error('Failed to parse shipping address JSON:', e);
          addr = null;
        }
      }
      
      if (addr && typeof addr === 'object') {
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
    } else {
      document.getElementById('shippingAddress').innerHTML = '<div style="color:#999;font-style:italic">No shipping address provided</div>';
    }

    // ALWAYS try to save receipt to database (will skip if already exists)
    // This ensures receipt is saved even if it wasn't in database
    console.log('Checking if receipt should be saved:', {
      has_receipt_id: !!receiptData.receipt_id,
      from_database: receiptData.from_database,
      orderId: receiptData.orderId || receiptData.order_number
    });
    
    // Save receipt to database (it will handle duplicates)
    saveReceiptToDatabase(receiptData);
  }

  // Try to fetch from database first
  if (orderNumberFromUrl) {
    console.log('Fetching receipt from database for order:', orderNumberFromUrl);
    fetch(`/jbr7php/get_receipts.php?order_number=${encodeURIComponent(orderNumberFromUrl)}`, {
      credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(result => {
      if (result.success && result.receipts && result.receipts.length > 0) {
        const receipt = result.receipts[0];
        // Use receipt_data if available, otherwise use the receipt fields
        if (receipt.receipt_data) {
          data = receipt.receipt_data;
          data.from_database = true;
          data.receipt_id = receipt.id;
          // Merge in any additional fields from receipt table
          if (receipt.created_at) data.created_at = receipt.created_at;
          // Ensure shipping address is properly set (from receipt table or receipt_data)
          if (!data.shippingAddress && receipt.shipping_address) {
            data.shippingAddress = receipt.shipping_address;
          }
          // Ensure orderId is set
          if (!data.orderId && receipt.order_number) {
            data.orderId = receipt.order_number;
          }
        } else {
          // Fallback: construct data from receipt table fields
          data = {
            orderId: receipt.order_number,
            order_number: receipt.order_number,
            subtotal: receipt.subtotal,
            shipping: receipt.shipping,
            total: receipt.total,
            payment: receipt.payment_method,
            courier: receipt.courier_service,
            customerEmail: receipt.customer_email,
            customerPhone: receipt.customer_phone,
            shippingAddress: receipt.shipping_address,
            created_at: receipt.created_at,
            from_database: true,
            receipt_id: receipt.id,
            items: [] // Will need to be populated from order_items if needed
          };
        }
        console.log('✅ Receipt loaded from database:', data);
        renderReceipt(data);
      } else {
        // Not found in database, try localStorage
        console.log('Receipt not found in database, trying localStorage...');
        loadFromLocalStorage();
      }
    })
    .catch(error => {
      console.error('Error fetching from database:', error);
      // Fallback to localStorage
      loadFromLocalStorage();
    });
  } else {
    // No order number in URL, try localStorage
    loadFromLocalStorage();
  }

  // Function to load from localStorage
  function loadFromLocalStorage() {
    const raw = localStorage.getItem('pendingCheckout');
    
    if (!raw) {
      console.error('No pendingCheckout data found in localStorage');
      alert('No receipt data found. Redirecting to cart...');
      window.location.href = 'cart.html';
      return;
    }

    try {
      data = JSON.parse(raw);
      console.log('Receipt data loaded from localStorage:', data);
      renderReceipt(data);
    } catch(e) {
      console.error('Failed to parse pendingCheckout:', e);
      alert('Error loading receipt data. Redirecting to cart...');
      window.location.href = 'cart.html';
      return;
    }
  }

  // Back button
  document.getElementById('backBtn').addEventListener('click', ()=>{ 
    window.location.href = 'explore.html'; 
  });

  // Save receipt to database
  function saveReceiptToDatabase(receiptData) {
    // Skip if already saved and from database
    if (receiptData.receipt_id && receiptData.from_database) {
      console.log('Receipt already saved to database, skipping save. Receipt ID:', receiptData.receipt_id);
      return;
    }
    
    console.log('🔄 Attempting to save receipt to database...', {
      orderId: receiptData.orderId || receiptData.order_number,
      hasItems: !!(receiptData.items && receiptData.items.length > 0),
      hasShippingAddress: !!receiptData.shippingAddress,
      subtotal: receiptData.subtotal,
      total: receiptData.total
    });
    
    // Ensure orderId is set (use order_number as fallback)
    if (!receiptData.orderId && receiptData.order_number) {
      receiptData.orderId = receiptData.order_number;
    }
    
    if (!receiptData.orderId) {
      console.error('❌ Cannot save receipt: No orderId or order_number found');
      return;
    }
    
    // Ensure shipping address is included even if null/empty
    // This allows receipt to be saved even without address
    if (!receiptData.shippingAddress) {
      receiptData.shippingAddress = null;
    }
    
    // Prepare data to send
    const dataToSend = {
      orderId: receiptData.orderId,
      items: receiptData.items || [],
      subtotal: receiptData.subtotal || 0,
      shipping: receiptData.shipping || 0,
      total: receiptData.total || 0,
      payment: receiptData.payment || receiptData.payment_method || null,
      courier: receiptData.courier || receiptData.courier_service || null,
      customerEmail: receiptData.customerEmail || receiptData.customer_email || null,
      customerPhone: receiptData.customerPhone || receiptData.customer_phone || null,
      shippingAddress: receiptData.shippingAddress,
      timestamp: receiptData.timestamp || new Date().toISOString()
    };
    
    console.log('📤 Sending receipt data to server:', dataToSend);
    
    fetch('/jbr7php/receipt.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(dataToSend)
    })
    .then(response => {
      console.log('📥 Receipt save response status:', response.status, response.statusText);
      if (!response.ok) {
        return response.text().then(text => {
          console.error('❌ HTTP error response:', text);
          throw new Error(`HTTP ${response.status}: ${text}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('📥 Receipt save response data:', data);
      if (data.success) {
        console.log('✅ Receipt saved to database successfully! Receipt ID:', data.receipt_id);
        // Update localStorage to mark as saved
        if (receiptData) {
          receiptData.receipt_id = data.receipt_id;
          receiptData.from_database = true;
          localStorage.setItem('pendingCheckout', JSON.stringify(receiptData));
        }
        // Show success message
        if (typeof showNotification === 'function') {
          showNotification('Receipt saved to database', 'success');
        }
      } else {
        console.error('❌ Failed to save receipt:', data.error);
        // Show error in console but don't block user
        if (data.error && !data.error.includes('address')) {
          console.warn('⚠️ Receipt save warning:', data.error);
          if (typeof showNotification === 'function') {
            showNotification('Receipt save warning: ' + data.error, 'error');
          }
        }
      }
    })
    .catch(error => {
      console.error('❌ Error saving receipt:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      // Show error but don't block user
      if (typeof showNotification === 'function') {
        showNotification('Could not save receipt to database. Check console for details.', 'error');
      }
    });
  }
})();