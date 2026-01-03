// receipt.js - read pendingCheckout from localStorage and render professional receipt
(function(){
  function fmt(n){ return '₱' + Number(n).toFixed(2); }

  const raw = localStorage.getItem('pendingCheckout');
  if (!raw) {
    // nothing to show, go back to cart
    window.location.href = 'cart.html';
    return;
  }
  const data = JSON.parse(raw);

  document.getElementById('orderId').textContent = data.orderId || '';
  document.getElementById('orderDate').textContent = new Date(data.timestamp).toLocaleString();
  document.getElementById('payment').textContent = 'Payment: ' + (data.payment || 'Not specified');
  document.getElementById('courier').textContent = 'Courier: ' + (data.courier || 'Not specified');

  const tbody = document.querySelector('#itemsTable tbody');
  tbody.innerHTML = '';
  (data.items || []).forEach(it => {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.innerHTML = `<div style="font-weight:700">${escapeHtml(it.name)}</div>` + (it.size ? `<div style="font-size:0.9rem;color:#666">Size: ${escapeHtml(it.size)}${it.color?(' • Color: '+escapeHtml(it.color)) : ''}</div>` : (it.color? `<div style="font-size:0.9rem;color:#666">Color: ${escapeHtml(it.color)}</div>` : ''));
    const tdUnit = document.createElement('td'); tdUnit.className='right'; tdUnit.textContent = fmt(it.unitPrice);
    const tdQty = document.createElement('td'); tdQty.className='right'; tdQty.textContent = it.quantity;
    const tdLine = document.createElement('td'); tdLine.className='right'; tdLine.textContent = fmt(it.lineTotal);
    tr.appendChild(tdName); tr.appendChild(tdUnit); tr.appendChild(tdQty); tr.appendChild(tdLine);
    tbody.appendChild(tr);
  });

  document.getElementById('subtotal').textContent = fmt(data.subtotal || 0);
  document.getElementById('shipping').textContent = (data.shipping === 0) ? 'FREE' : fmt(data.shipping || 0);
  document.getElementById('tax').textContent = fmt(data.tax || 0);
  document.getElementById('total').textContent = fmt(data.total || 0);

  const cust = [];
  if (data.customerEmail) cust.push(data.customerEmail);
  if (data.customerPhone) cust.push(data.customerPhone);
  document.getElementById('custContact').textContent = cust.join(' • ') || '—';

  document.getElementById('backBtn').addEventListener('click', ()=>{ window.location.href = 'explore.html'; });

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
})();
