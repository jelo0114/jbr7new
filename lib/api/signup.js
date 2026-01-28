import { createHash } from 'crypto';
import { supabase } from '../../lib/supabaseClient';

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
  // Set CORS headers if needed
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { username, email, password } = req.body || {};

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, error: 'Username, email, and password are required' });
    }

    // Check if email already exists
    const { data: existing, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingError) {
      console.error('Database error:', existingError);
      throw existingError;
    }
    
    if (existing) {
      return res
        .status(400)
        .json({ success: false, error: 'Email is already registered' });
    }

    const password_hash = hashPassword(password);

    const { data, error } = await supabase
      .from('users')
      .insert({ username, email, password_hash })
      .select('id')
      .single(); // Use .single() instead of .maybeSingle() after insert

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    return res.status(200).json({
      success: true,
      user_id: data?.id || null,
    });
  } catch (e) {
    console.error('signup error:', e);
    return res.status(500).json({ success: false, error: 'Signup failed' });
  }
}
