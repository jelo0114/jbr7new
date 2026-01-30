// pages/api/receipts.js
import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      return await handleGetReceipts(req, res);
    } else if (req.method === 'POST') {
      return await handleSaveReceipt(req, res);
    } else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (err) {
    console.error('Receipts API error:', err);
    const message = err && err.message ? err.message : 'Internal server error';
    return res.status(500).json({ success: false, error: message });
  }
}

// GET receipts
async function handleGetReceipts(req, res) {
  const { userId, orderId, receiptId } = req.query;

  if (!userId && !orderId && !receiptId) {
    return res.status(400).json({ 
      success: false, 
      error: 'userId, orderId, or receiptId is required' 
    });
  }

  try {
    let query = supabase.from('receipts').select('*');

    if (receiptId) {
      query = query.eq('id', parseInt(receiptId)).limit(1);
    } else if (orderId) {
      query = query.eq('order_id', parseInt(orderId));
    } else if (userId) {
      query = query.eq('user_id', parseInt(userId)).order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get receipts error:', error);
      return res.status(500).json({ success: false, error: 'Database query failed' });
    }

    if (receiptId && (!data || data.length === 0)) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }

    return res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('handleGetReceipts error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch receipts' });
  }
}

// POST - Save receipt
async function handleSaveReceipt(req, res) {
  const { userId, receiptData } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: 'userId is required' });
  }
  if (!receiptData || typeof receiptData !== 'object') {
    return res.status(400).json({ success: false, error: 'receiptData is required' });
  }

  try {
    // Try to find order by order_number or orderId
    let orderId = null;
    
    if (receiptData.orderId || receiptData.orderNumber) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', receiptData.orderNumber || receiptData.orderId)
        .single();
      
      if (orderData) {
        orderId = orderData.id;
      }
    }

    // Prepare receipt record
    const receiptRecord = {
      user_id: parseInt(userId),
      order_id: orderId,
      order_number: receiptData.orderNumber || receiptData.orderId || null,
      payment_provider: receiptData.payment_provider || receiptData.payment || null,
      payment_provider_id: receiptData.payment_provider_id || null,
      amount: parseFloat(receiptData.amount) || 0,
      currency: receiptData.currency || 'PHP',
      status: receiptData.status || 'succeeded',
      captured_at: receiptData.captured_at ? new Date(receiptData.captured_at).toISOString() : new Date().toISOString(),
      raw_response: JSON.stringify(receiptData.raw_response || receiptData),
      created_at: new Date().toISOString()
    };

    // Check if receipt already exists
    let existingReceipt = null;
    if (orderId) {
      const { data } = await supabase
        .from('receipts')
        .select('id')
        .eq('order_id', orderId)
        .single();
      
      if (data) {
        existingReceipt = data;
      }
    }

    if (existingReceipt) {
      // Update existing receipt
      const { data: updated, error: updateError } = await supabase
        .from('receipts')
        .update({
          ...receiptRecord,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingReceipt.id)
        .select()
        .single();

      if (updateError) {
        console.error('Receipt update error:', updateError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update receipt: ' + updateError.message 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Receipt updated successfully',
        receipt_id: updated.id,
        data: updated
      });
    } else {
      // Insert new receipt
      const { data: inserted, error: insertError } = await supabase
        .from('receipts')
        .insert(receiptRecord)
        .select()
        .single();

      if (insertError) {
        console.error('Receipt insert error:', insertError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save receipt: ' + insertError.message 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Receipt saved successfully',
        receipt_id: inserted.id,
        data: inserted
      });
    }
  } catch (err) {
    console.error('handleSaveReceipt error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to save receipt: ' + err.message 
    });
  }
}