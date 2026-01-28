// api/signin.js
// Authenticates a user against the Supabase 'users' table

import crypto from 'crypto';
import { supabase } from '../lib/supabaseClient';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, error: 'Invalid email or password' });
    }

    const hashed = hashPassword(password);
    if (hashed !== user.password_hash) {
      return res
        .status(401)
        .json({ success: false, error: 'Invalid email or password' });
    }

    // Client stores user_id (in sessionStorage) and passes as X-User-Id
    return res.status(200).json({
      success: true,
      user_id: user.id,
    });
  } catch (e) {
    console.error('signin error:', e);
    return res.status(500).json({ success: false, error: 'Signin failed' });
  }
}

