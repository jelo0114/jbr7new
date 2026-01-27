// api/check_auth.js
// Simple auth check based on X-User-Id header

import { supabase } from '../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userIdHeader = req.headers['x-user-id'] || req.headers['x-userid'];
  const userId = userIdHeader ? Number(userIdHeader) : null;

  if (!userId) {
    return res.status(200).json({ authenticated: false });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(200).json({ authenticated: false });
    }

    return res.status(200).json({ authenticated: true, user_id: userId });
  } catch (e) {
    console.error('check_auth error:', e);
    return res.status(500).json({ authenticated: false, error: 'Server error' });
  }
}

