// api/get_login_history.js
// Returns login_history rows for the current user (if you log them)

import { supabase } from '../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const userIdHeader = req.headers['x-user-id'] || req.headers['x-userid'];
  const userId = userIdHeader ? Number(userIdHeader) : null;

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  try {
    const { data, error } = await supabase
      .from('login_history')
      .select('id, ip_address, user_agent, login_time, logout_time, session_duration')
      .eq('user_id', userId)
      .order('login_time', { ascending: false })
      .limit(100);

    if (error) throw error;

    const history = (data || []).map((row) => ({
      id: row.id,
      ip_address: row.ip_address || '',
      login_time: row.login_time,
      logout_time: row.logout_time,
      session_duration: row.session_duration,
      device_info: row.user_agent || 'Unknown device',
    }));

    return res.status(200).json({
      success: true,
      history,
      count: history.length,
    });
  } catch (e) {
    console.error('get_login_history error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load login history' });
  }
}

