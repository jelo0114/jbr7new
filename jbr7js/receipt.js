// receipt.js - read pendingCheckout from localStorage and render professional receipt
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
  
  // Be defensive: some deployments may store slightly different keys (price vs unitPrice/basePrice)
  let items = data.items || [];
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
  let subtotalVal = (typeof data.subtotal !== 'undefined' && data.subtotal) ? Number(data.subtotal) : null;
  let shippingVal = (typeof data.shipping !== 'undefined') ? Number(data.shipping) : null;

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

  // Save receipt to database
  saveReceiptToDatabase(data);

  // Back button
  document.getElementById('backBtn').addEventListener('click', ()=>{ 
    window.location.href = 'explore.html'; 
  });

  function escapeHtml(s){ 
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
  }

  // Save receipt to database
  function saveReceiptToDatabase(receiptData) {
    console.log('Attempting to save receipt to database...', receiptData);
    
    fetch('/jbr7php/receipt.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(receiptData)
    })
    .then(response => {
      console.log('Receipt save response status:', response.status);
      if (!response.ok) {
        return response.text().then(text => {
          console.error('HTTP error response:', text);
          throw new Error(`HTTP ${response.status}: ${text}`);
        });
      }
      return response.json();
    })
    .then(data => {
      console.log('Receipt save response data:', data);
      if (data.success) {
        console.log('✅ Receipt saved to database successfully! Receipt ID:', data.receipt_id);
      } else {
        console.error('❌ Failed to save receipt:', data.error);
        // Show user-friendly error
        alert('Warning: Receipt could not be saved to database. Error: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('❌ Error saving receipt:', error);
      // Show user-friendly error
      alert('Warning: Could not save receipt to database. Please check your connection. Error: ' + error.message);
    });
  }
})();