// pages/api/receipts.js
import { createClient } from '@supabase/supabase-js';

// Prefer service role key for server writes. Fallback to anon key if not available.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Helpers
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isPositiveInteger = (v) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0;
};
const sanitize = (s, max = 1000) => (s === undefined || s === null) ? null : String(s).trim().slice(0, max);

export default async function handler(req, res) {
  // CORS (adjust origin as needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') return await handleGetReceipts(req, res);
    if (req.method === 'POST') return await handleSaveReceipt(req, res);
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('Receipts handler error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

async function handleGetReceipts(req, res) {
  const { userId, orderId, receiptId } = req.query;

  if (!userId && !orderId && !receiptId) {
    return res.status(400).json({ success: false, error: 'userId, orderId, or receiptId is required' });
  }

  try {
    // receiptId path (single)
    if (receiptId) {
      // try numeric id, uuid, or receipt_id column
      let q = supabase.from('receipts').select('*').limit(1);
      if (isPositiveInteger(receiptId)) {
        q = q.eq('id', parseInt(receiptId));
      } else if (uuidRegex.test(receiptId)) {
        q = q.or(`id.eq.${receiptId},receipt_id.eq.${receiptId}`);
      } else {
        q = q.or(`receipt_id.eq.${receiptId},id.eq.${receiptId}`);
      }

      const { data, error } = await q;
      if (error) {
        console.error('Get receipt by id error:', error);
        return res.status(500).json({ success: false, error: 'Database error' });
      }
      if (!data || data.length === 0) return res.status(404).json({ success: false, error: 'Receipt not found' });
      return res.status(200).json({ success: true, data: data[0] });
    }

    // orderId path - allow uuid, numeric, or order_number
    if (orderId) {
      // If looks like uuid or numeric, attempt to match order_id or order id; otherwise try to resolve by order_number
      let dbOrderId = null;

      if (uuidRegex.test(orderId) || isPositiveInteger(orderId)) {
        // Try receipts.order_id directly
        const { data, error } = await supabase
          .from('receipts')
          .select('*')
          .or(`order_id.eq.${orderId},order_number.eq.${orderId}`)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Get receipts by orderId error:', error);
          return res.status(500).json({ success: false, error: 'Database error' });
        }
        return res.status(200).json({ success: true, data: data || [] });
      } else {
        // Treat orderId as order_number; attempt to resolve order id from orders table first
        try {
          const { data: orderData, error: orderErr } = await supabase
            .from('orders')
            .select('id')
            .or(`order_number.eq.${orderId},order_id.eq.${orderId}`)
            .limit(1);

          if (orderErr) {
            console.warn('Order lookup by order_number returned error (continuing):', orderErr.message || orderErr);
          }

          if (orderData && orderData.length > 0 && orderData[0].id) dbOrderId = orderData[0].id;
        } catch (e) {
          console.warn('Order lookup exception (continuing):', e);
        }

        if (!dbOrderId) {
          // If we couldn't resolve order id, fall back to receipts.order_number match
          const { data, error } = await supabase
            .from('receipts')
            .select('*')
            .eq('order_number', orderId)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Fallback receipts by order_number error:', error);
            return res.status(500).json({ success: false, error: 'Database error' });
          }
          return res.status(200).json({ success: true, data: data || [] });
        }

        // Query receipts by resolved order id
        const { data, error } = await supabase
          .from('receipts')
          .select('*')
          .eq('order_id', dbOrderId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Get receipts by resolved order id error:', error);
          return res.status(500).json({ success: false, error: 'Database error' });
        }
        return res.status(200).json({ success: true, data: data || [] });
      }
    }

    // userId path - return receipts for user
    if (userId) {
      const maybeInt = parseInt(userId);
      let q = supabase.from('receipts').select('*').order('created_at', { ascending: false });
      if (isPositiveInteger(maybeInt)) q = q.eq('user_id', maybeInt);
      else q = q.eq('user_id', String(userId));

      const { data, error } = await q;
      if (error) {
        console.error('Get receipts by userId error:', error);
        return res.status(500).json({ success: false, error: 'Database error' });
      }
      return res.status(200).json({ success: true, data: data || [] });
    }

    return res.status(400).json({ success: false, error: 'Invalid query' });
  } catch (err) {
    console.error('handleGetReceipts unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Failed to get receipts' });
  }
}

async function handleSaveReceipt(req, res) {
  const { userId, receiptData } = req.body || {};

  if (!userId) return res.status(400).json({ success: false, error: 'userId is required' });
  if (!receiptData || typeof receiptData !== 'object') return res.status(400).json({ success: false, error: 'receiptData is required' });

  try {
    // Resolve order id if provided as orderNumber or orderId
    let dbOrderId = null;

    if (receiptData.orderId && (uuidRegex.test(receiptData.orderId) || isPositiveInteger(receiptData.orderId))) {
      // Check receipts.orders existence via orders table (best-effort)
      try {
        const { data: ord, error: ordErr } = await supabase
          .from('orders')
          .select('id')
          .or(`id.eq.${receiptData.orderId},order_id.eq.${receiptData.orderId}`)
          .limit(1);

        if (!ordErr && ord && ord.length > 0 && ord[0].id) dbOrderId = ord[0].id;
      } catch (e) { /* continue */ }
    }

    if (!dbOrderId && receiptData.orderNumber) {
      try {
        const { data: ordNum, error: ordNumErr } = await supabase
          .from('orders')
          .select('id')
          .or(`order_number.eq.${receiptData.orderNumber},order_id.eq.${receiptData.orderNumber}`)
          .limit(1);

        if (!ordNumErr && ordNum && ordNum.length > 0 && ordNum[0].id) dbOrderId = ordNum[0].id;
      } catch (e) { /* continue */ }
    }

    if (!dbOrderId && receiptData.orderNumber && !isPositiveInteger(receiptData.orderNumber) && !uuidRegex.test(receiptData.orderNumber)) {
      // Could be that receipts table stores order_number directly; we will continue without resolving
      // but later match by order_number if needed.
    }

    if (!dbOrderId && receiptData.orderId && !uuidRegex.test(receiptData.orderId) && !isPositiveInteger(receiptData.orderId)) {
      // nothing more to do
    }

    // Build payload mapping common keys
    const payload = {
      user_id: isPositiveInteger(userId) ? parseInt(userId) : String(userId),
      order_id: dbOrderId || null,
      order_number: sanitize(receiptData.orderNumber || receiptData.order_number || null, 100),
      payment_provider: sanitize(receiptData.payment_provider || receiptData.provider || null, 100),
      payment_provider_id: sanitize(receiptData.payment_provider_id || receiptData.provider_id || receiptData.chargeId || receiptData.transaction_id || null, 200),
      amount: receiptData.amount !== undefined ? parseFloat(receiptData.amount) : (receiptData.total ? parseFloat(receiptData.total) : null),
      currency: sanitize(receiptData.currency || 'USD', 10),
      status: sanitize(receiptData.status || 'succeeded', 50),
      captured_at: receiptData.captured_at ? new Date(receiptData.captured_at).toISOString() : null,
      raw_response: receiptData.raw_response ? JSON.stringify(receiptData.raw_response) : JSON.stringify(receiptData)
    };

    // Remove null fields to avoid explicit null inserts if your schema has defaults
    Object.keys(payload).forEach(k => {
      if (payload[k] === null || payload[k] === undefined) delete payload[k];
    });

    // Check for existing receipt: try match by order_id, or payment_provider_id
    let existing = null;
    try {
      if (payload.order_id) {
        const { data: ex, error: exErr } = await supabase
          .from('receipts')
          .select('id,status,payment_provider_id')
          .eq('order_id', payload.order_id)
          .limit(1);

        if (!exErr && ex && ex.length > 0) existing = ex[0];
      }

      if (!existing && payload.payment_provider_id) {
        const { data: ex2, error: ex2Err } = await supabase
          .from('receipts')
          .select('id,status,payment_provider_id')
          .eq('payment_provider_id', payload.payment_provider_id)
          .limit(1);

        if (!ex2Err && ex2 && ex2.length > 0) existing = ex2[0];
      }

      // If we still have no existing and payload.order_number exists, look by order_number
      if (!existing && payload.order_number) {
        const { data: ex3, error: ex3Err } = await supabase
          .from('receipts')
          .select('id,status,payment_provider_id')
          .eq('order_number', payload.order_number)
          .limit(1);

        if (!ex3Err && ex3 && ex3.length > 0) existing = ex3[0];
      }
    } catch (e) {
      console.warn('Existing receipt lookup warning:', e);
    }

    if (existing && existing.id) {
      // Update existing receipt
      const updatePayload = {
        ...payload,
        updated_at: new Date().toISOString()
      };
      try {
        const { data: updated, error: updErr } = await supabase
          .from('receipts')
          .update(updatePayload)
          .eq('id', existing.id)
          .select()
          .limit(1);

        if (updErr) {
          console.error('Failed to update existing receipt:', updErr);
          return res.status(500).json({ success: false, error: 'Failed to update existing receipt' });
        }

        return res.status(200).json({
          success: true,
          message: 'Receipt updated',
          receipt_id: existing.id,
          data: updated && updated.length ? updated[0] : updated
        });
      } catch (e) {
        console.error('Update existing receipt exception:', e);
        return res.status(500).json({ success: false, error: 'Failed to update receipt' });
      }
    } else {
      // Insert new receipt
      const insertPayload = {
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      try {
        const { data: inserted, error: insErr } = await supabase
          .from('receipts')
          .insert(insertPayload)
          .select()
          .limit(1);

        if (insErr) {
          console.error('Receipt insert error:', insErr);
          return res.status(500).json({ success: false, error: 'Failed to create receipt' });
        }

        const insertedRow = Array.isArray(inserted) ? inserted[0] : inserted;
        return res.status(200).json({
          success: true,
          message: 'Receipt saved successfully',
          receipt_id: insertedRow && (insertedRow.id || insertedRow.receipt_id),
          data: insertedRow
        });
      } catch (e) {
        console.error('Receipt insert exception:', e);
        return res.status(500).json({ success: false, error: 'Failed to save receipt' });
      }
    }
  } catch (err) {
    console.error('handleSaveReceipt unexpected error:', err);
    return res.status(500).json({ success: false, error: 'Failed to save receipt' });
  }
}