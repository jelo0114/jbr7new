// api/receipt.js - uses shared Supabase client (same as get.js, post.js)
import { supabase } from '../lib/supabaseClient';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if Supabase is configured
  if (!supabase) {
    console.error('❌ Supabase not initialized');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'MISSING');
    
    return res.status(503).json({
      success: false,
      error: 'Database not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables in Vercel.',
      debug: {
        url_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key_set: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
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
    console.error('❌ Receipts API error:', err);
    console.error('Error stack:', err.stack);
    return res.status(500).json({ 
      success: false, 
      error: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

// GET receipts
async function handleGetReceipts(req, res) {
  const { userId, orderId, orderNumber, receiptId } = req.query;

  if (!userId && !orderId && !orderNumber && !receiptId) {
    return res.status(400).json({ 
      success: false, 
      error: 'userId, orderId, orderNumber, or receiptId is required' 
    });
  }

  try {
    let query = supabase.from('receipts').select('*');

    if (receiptId) {
      query = query.eq('id', parseInt(receiptId)).limit(1);
    } else if (orderId) {
      query = query.eq('order_id', parseInt(orderId));
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber);
    } else if (userId) {
      query = query.eq('user_id', parseInt(userId)).order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Get receipts error:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Database query failed: ' + error.message 
      });
    }

    if (receiptId && (!data || data.length === 0)) {
      return res.status(404).json({ success: false, error: 'Receipt not found' });
    }

    return res.status(200).json({ success: true, data: data || [] });
  } catch (err) {
    console.error('❌ handleGetReceipts error:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch receipts: ' + err.message 
    });
  }
}

// POST - Save receipt
async function handleSaveReceipt(req, res) {
  console.log('=== RECEIPT SAVE ATTEMPT ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  const { userId, receiptData } = req.body;

  if (!userId) {
    console.error('❌ Validation failed: userId is required');
    return res.status(400).json({ success: false, error: 'userId is required' });
  }
  if (!receiptData || typeof receiptData !== 'object') {
    console.error('❌ Validation failed: receiptData is required');
    return res.status(400).json({ success: false, error: 'receiptData is required' });
  }

  try {
    // Try to find order by order_number or orderId
    let orderId = null;
    
    if (receiptData.orderId || receiptData.orderNumber) {
      console.log('🔍 Looking for order:', receiptData.orderNumber || receiptData.orderId);
      
      const { data: orderData, error: orderLookupError } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', receiptData.orderNumber || receiptData.orderId)
        .single();
      
      if (orderLookupError) {
        console.warn('⚠️ Order lookup error (non-fatal):', orderLookupError.message);
      }
      
      if (orderData) {
        orderId = orderData.id;
        console.log('✅ Found order ID:', orderId);
      } else {
        console.warn('⚠️ Order not found, creating receipt without order link');
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

    console.log('📝 Receipt record:', receiptRecord);

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
        console.log('📄 Found existing receipt:', existingReceipt.id);
      }
    }

    if (existingReceipt) {
      // Update existing receipt
      console.log('🔄 Updating existing receipt...');
      
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
        console.error('❌ Receipt update error:', updateError);
        console.error('Error details:', JSON.stringify(updateError, null, 2));
        
        // Check if it's a table/schema error
        if (updateError.message && /relation|does not exist|table|column/i.test(updateError.message)) {
          return res.status(503).json({ 
            success: false, 
            error: 'Receipts table not set up. Please create the receipts table in Supabase.',
            details: updateError.message
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update receipt: ' + updateError.message 
        });
      }

      console.log('✅ Receipt updated successfully');

      return res.status(200).json({
        success: true,
        message: 'Receipt updated successfully',
        receipt_id: updated.id,
        data: updated
      });
    } else {
      // Insert new receipt
      console.log('➕ Creating new receipt...');
      
      const { data: inserted, error: insertError } = await supabase
        .from('receipts')
        .insert(receiptRecord)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Receipt insert error:', insertError);
        console.error('Error details:', JSON.stringify(insertError, null, 2));
        
        // Check if it's a table/schema error
        if (insertError.message && /relation|does not exist|table|column/i.test(insertError.message)) {
          return res.status(503).json({ 
            success: false, 
            error: 'Receipts table not set up. Please create the receipts table in Supabase.',
            details: insertError.message
          });
        }
        
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to save receipt: ' + insertError.message 
        });
      }

      console.log('✅ Receipt created successfully');

      return res.status(200).json({
        success: true,
        message: 'Receipt saved successfully',
        receipt_id: inserted.id,
        data: inserted
      });
    }
  } catch (err) {
    console.error('❌ handleSaveReceipt error:', err);
    console.error('Error stack:', err.stack);
    
    const isConfigError = err.message && /relation|does not exist|table|column/i.test(err.message);
    const status = isConfigError ? 503 : 500;
    return res.status(status).json({
      success: false,
      error: isConfigError ? 'Receipts table not set up. Please create the receipts table in Supabase.' : ('Failed to save receipt: ' + err.message)
    });
  }
}