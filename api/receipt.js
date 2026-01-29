// pages/api/receipts.js
// Receipts endpoint for saving and retrieving receipts

import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  // Only allow POST and GET requests
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (req.method === 'GET') {
      return await handleGetReceipts(req, res);
    } else if (req.method === 'POST') {
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

// ==================== GET RECEIPTS ====================
async function handleGetReceipts(req, res) {
  const { userId, orderId, receiptId } = req.query;

  if (!userId && !orderId && !receiptId) {
    return res.status(400).json({ error: 'userId, orderId, or receiptId is required' });
  }

  try {
    let query = supabase.from('receipts').select('*');

    if (receiptId) {
      query = query.eq('id', receiptId).single();
    } else if (orderId) {
      query = query.eq('order_id', orderId).single();
    } else if (userId) {
      query = query.eq('user_id', userId).order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Get receipts error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ==================== SAVE RECEIPT ====================
async function handleSaveReceipt(req, res) {
  const { userId, receiptData } = req.body;

  // Validation
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  if (!receiptData) {
    return res.status(400).json({ error: 'receiptData is required' });
  }

  try {
    // First, try to find the order by order_id or order_number
    let dbOrderId = null;
    
    if (receiptData.orderId) {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('order_id', receiptData.orderId)
        .single();

      if (!orderError && orderData) {
        dbOrderId = orderData.id;
      }
    }

    if (!dbOrderId && receiptData.orderNumber) {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', receiptData.orderNumber)
        .single();

      if (!orderError && orderData) {
        dbOrderId = orderData.id;
      }
    }

    if (!dbOrderId) {
      console.error('Could not find order for receipt');
      return res.status(404).json({
        success: false,
        error: 'Order not found for this receipt'
      });
    }

    // Check if receipt already exists for this order
    const { data: existingReceipt } = await supabase
      .from('receipts')
      .select('id')
      .eq('order_id', dbOrderId)
      .single();

    if (existingReceipt) {
      // Update existing receipt
      const { data, error } = await supabase
        .from('receipts')
        .update({
          receipt_data: receiptData
        })
        .eq('id', existingReceipt.id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Receipt updated successfully',
        receipt_id: data.id,
        data: data
      });
    } else {
      // Insert new receipt
      const { data, error } = await supabase
        .from('receipts')
        .insert({
          user_id: userId,
          order_id: dbOrderId,
          receipt_data: receiptData
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Receipt saved successfully',
        receipt_id: data.id,
        data: data
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