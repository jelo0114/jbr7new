// api/get_user_activities.js
// Returns rewards/activities and total points for the current user

import { getUserActivities } from '../supabse-conn/index';
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
    const activitiesRaw = await getUserActivities(userId);

    const activities = (activitiesRaw || []).map((a) => ({
      type: a.activity_type,
      description: a.description || a.activity_type,
      points: a.points_awarded || 0,
      date: a.created_at,
      time_ago: '', // could be computed on client
    }));

    const { data: userRow, error } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;

    const points = userRow?.points ?? 0;

    return res.status(200).json({ success: true, activities, points });
  } catch (e) {
    console.error('get_user_activities error:', e);
    return res.status(500).json({ success: false, error: 'Failed to load activities' });
  }
}

