(async function () {
  // Helpers
  function qs(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  function formatCurrency(v) {
    if (v == null) return '₱0.00';
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(v);
  }

  function setText(id, txt) {
    const el = document.getElementById(id);
    if (el) el.textContent = txt || '';
  }

  // Read query params: receiptId, orderId, userId
  const receiptId = qs('receiptId') || qs('receipt_id') || null;
  const orderId = qs('orderId') || qs('order_id') || null;
  const userId = qs('userId') || qs('user_id') || null;

  if (!receiptId && !orderId && !userId) {
    document.getElementById('receiptRoot').innerHTML = '<p style="padding:1rem;color:#b00">No receiptId, orderId or userId provided in the URL.</p>';
    return;
  }

  // Build URL
  const params = new URLSearchParams();
  if (receiptId) params.set('receiptId', receiptId);
  else if (orderId) params.set('orderId', orderId);
  else params.set('userId', userId);

  const apiUrl = `/api/receipts?${params.toString()}`;

  try {
    const resp = await fetch(apiUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!resp.ok) {
      const errBody = await resp.json().catch(()=>({ error: resp.statusText }));
      throw new Error(errBody.error || `HTTP ${resp.status}`);
    }
    const payload = await resp.json();
    if (!payload.success || !payload.data) {
      throw new Error(payload.error || 'Empty response');
    }

    // payload.data may be an object (single) or array
    let receipt = payload.data;
    if (Array.isArray(receipt)) {
      if (receipt.length === 0) throw new Error('No receipts found');
      // If multiple, pick the most recent (assuming created_at exists)
      receipt = receipt.sort((a,b)=> new Date(b.created_at || 0) - new Date(a.created_at || 0))[0];
    }

    // Map DB fields to UI - adjust these mappings if your DB uses different names
    // Common fields used here: order_number, created_at, payment_provider, courier, items (array), subtotal, shipping, total,
    // shipping_name, shipping_phone, shipping_address_line1, shipping_address_line2, shipping_city, shipping_province, shipping_postal_code, shipping_country
    const r = receipt;
    const raw = r.receipt_data || r.raw_response || r.metadata || r; // fallback if nested

    // Order / meta
    setText('orderId', `Order: ${raw.order_number || r.order_number || r.order_id || ''}`);
    setText('orderDate', raw.created_at || r.created_at ? `Date: ${new Date(raw.created_at || r.created_at).toLocaleString()}` : '');

    setText('payment', `Payment: ${raw.payment_provider || r.payment_provider || raw.provider || ''}`);
    setText('courier', `Courier: ${raw.courier || r.courier || raw.shipping_method || ''}`);

    // Items: expect raw.items or r.items as array of { name, unit_price, qty, line_total }
    const items = raw.items || r.items || [];
    const tbody = document.querySelector('#itemsTable tbody');
    tbody.innerHTML = '';
    let subtotal = 0;
    items.forEach(it => {
      const name = it.name || it.title || it.product_name || '';
      const unit = (it.unit_price != null) ? formatCurrency(Number(it.unit_price)) : (it.unit || '');
      const qty = it.qty != null ? it.qty : (it.quantity != null ? it.quantity : 1);
      const line = (it.line_total != null) ? Number(it.line_total) : (it.unit_price != null ? Number(it.unit_price) * qty : 0);
      subtotal += line;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${name}</td><td class="right">${unit}</td><td class="right">${qty}</td><td class="right">${formatCurrency(line)}</td>`;
      tbody.appendChild(tr);
    });

    // Totals - fallback to computed if not present
    const shippingAmt = raw.shipping != null ? Number(raw.shipping) : (r.shipping != null ? Number(r.shipping) : 0);
    const totalAmt = raw.total != null ? Number(raw.total) : (r.total != null ? Number(r.total) : (subtotal + shippingAmt));

    setText('subtotal', formatCurrency(raw.subtotal != null ? Number(raw.subtotal) : subtotal));
    setText('shipping', formatCurrency(shippingAmt));
    setText('total', formatCurrency(totalAmt));

    // Customer contact
    setText('custContact', raw.customer_email || r.customer_email || (raw.customer && raw.customer.email) || '');

    // Shipping address parts
    setText('shippingName', (raw.shipping_name || raw.recipient_name || r.shipping_name || '') );
    setText('shippingPhone', (raw.shipping_phone || r.shipping_phone || r.recipient_phone || '') );
    setText('shippingAddressLine1', (raw.shipping_address_line1 || raw.address_line1 || r.address_line1 || '') );
    setText('shippingAddressLine2', (raw.shipping_address_line2 || raw.address_line2 || r.address_line2 || '') );
    setText('shippingCityProvince', [raw.shipping_city || r.shipping_city, raw.shipping_province || r.shipping_province].filter(Boolean).join(', '));
    setText('shippingPostalCode', raw.shipping_postal_code || r.shipping_postal_code || '');
    setText('shippingCountry', raw.shipping_country || r.shipping_country || '');

    // Back button behavior
    document.getElementById('backBtn').addEventListener('click', ()=> {
      window.location.href = '/';
    });

  } catch (err) {
    console.error('Receipt load error:', err);
    document.getElementById('receiptRoot').innerHTML = `<p style="padding:1rem;color:#b00">Error loading receipt: ${err.message}</p>`;
  }
})();