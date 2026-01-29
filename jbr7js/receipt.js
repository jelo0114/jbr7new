// pages/api/receipts.js
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (req.method === 'GET') {
      return await handleGetReceipts(req, res);
    } else {
      return await handleSaveReceipt(req, res);
    }
  } catch (error) {
    console.error('Receipts API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

async function handleGetReceipts(req, res) {
  const { userId, orderId, receiptId } = req.query;

  if (!userId && !orderId && !receiptId) {
    return res.status(400).json({ error: 'userId, orderId, or receiptId is required' });
  }

  try {
    let query;

    if (receiptId) {
      query = supabase.from('receipts').select('*').eq('id', receiptId).single();
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    if (orderId) {
      // orderId may be an order id (UUID) or an order_number; try to detect format
      // If it looks like a UUID, query receipts.order_id; otherwise try to resolve order_number -> id
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      let dbOrderId = null;

      if (uuidRegex.test(orderId)) {
        dbOrderId = orderId;
      } else {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('id')
          .eq('order_number', orderId)
          .limit(1)
          .single();

        if (orderError && orderError.code !== 'PGRST116') { // single() returns 406 or similar when not found; handle generically
          // If not found, we will treat dbOrderId as null
          console.warn('Order lookup error by order_number:', orderError.message || orderError);
        } else if (orderData && orderData.id) {
          dbOrderId = orderData.id;
        }
      }

      if (!dbOrderId) {
        return res.status(404).json({ success: false, error: 'Order not found' });
      }

      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('order_id', dbOrderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    // userId path - return all receipts for user, newest first
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get receipts error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to get receipts' });
  }
}

async function handleSaveReceipt(req, res) {
  const { userId, receiptData } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!receiptData || typeof receiptData !== 'object') {
    return res.status(400).json({ error: 'receiptData is required and must be an object' });
  }

  try {
    // Resolve order: receiptData may contain orderId (UUID) or orderNumber
    let dbOrderId = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (receiptData.orderId && uuidRegex.test(receiptData.orderId)) {
      // Verify order exists
      const { data: orderById, error: orderByIdErr } = await supabase
        .from('orders')
        .select('id')
        .eq('id', receiptData.orderId)
        .limit(1)
        .single();

      if (!orderByIdErr && orderById && orderById.id) dbOrderId = orderById.id;
    }

    if (!dbOrderId && receiptData.orderNumber) {
      const { data: orderByNumber, error: orderByNumberErr } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', receiptData.orderNumber)
        .limit(1)
        .single();

      if (!orderByNumberErr && orderByNumber && orderByNumber.id) dbOrderId = orderByNumber.id;
    }

    if (!dbOrderId) {
      console.error('Could not find order for receipt');
      return res.status(404).json({ success: false, error: 'Order not found for this receipt' });
    }

    // Check for existing receipt for this order (you may allow multiple receipts if supporting partial payments)
    const { data: existingReceipt, error: existingError } = await supabase
      .from('receipts')
      .select('id, status, payment_provider_id')
      .eq('order_id', dbOrderId)
      .limit(1)
      .single();

    // Prepare receipt payload for insert/update. Map common fields if present.
    const payload = {
      user_id: userId,
      order_id: dbOrderId,
      payment_provider: receiptData.payment_provider || receiptData.provider || null,
      payment_provider_id: receiptData.payment_provider_id || receiptData.provider_id || receiptData.chargeId || null,
      amount: typeof receiptData.amount === 'number' ? receiptData.amount : receiptData.total || null,
      currency: receiptData.currency || 'USD',
      status: receiptData.status || 'succeeded',
      captured_at: receiptData.captured_at ? new Date(receiptData.captured_at) : null,
      raw_response: receiptData.raw_response || receiptData
    };

    // Remove null keys to avoid inserting explicit nulls where not needed
    Object.keys(payload).forEach((k) => {
      if (payload[k] === null) delete payload[k];
    });

    if (existingReceipt && existingReceipt.id) {
      // Update existing receipt
      const { data, error } = await supabase
        .from('receipts')
        .update({
          ...payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReceipt.id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Receipt updated successfully',
        receipt_id: data.id,
        data
      });
    } else {
      // Insert new receipt
      const { data, error } = await supabase
        .from('receipts')
        .insert({
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Receipt saved successfully',
        receipt_id: data.id,
        data
      });
    }
  } catch (error) {
    console.error('Save receipt error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to save receipt'
    });
  }
}