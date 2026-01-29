// pages/api/auth.js
// Updated authentication handler using Supabase Auth

import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, username, email, password } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action parameter is required' });
  }

  try {
    if (action === 'signup') {
      // Validate inputs
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Username, email, and password are required' 
        });
      }

      // OPTION 1: Use Supabase Auth (Recommended)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          },
          emailRedirectTo: undefined // Skip email confirmation for now
        }
      });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        return res.status(400).json({ 
          success: false, 
          error: signUpError.message 
        });
      }

      // Also create entry in custom users table with the Auth user ID
      if (authData.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id, // Use Auth user ID
            username: username,
            email: email,
            points: 0
          });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          // Auth user was created, but profile creation failed
          // You might want to handle this differently
        }
      }

      return res.status(200).json({
        success: true,
        user_id: authData.user?.id,
        username: username,
        email: email
      });

    } else if (action === 'signin') {
      // Validate inputs
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Email and password are required' 
        });
      }

      // OPTION 1: Use Supabase Auth (Recommended)
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        console.error('Login error:', signInError);
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid email or password' 
        });
      }

      // Get additional user data from custom users table
      const { data: userData } = await supabase
        .from('users')
        .select('username, points')
        .eq('id', signInData.user.id)
        .single();

      return res.status(200).json({
        success: true,
        user_id: signInData.user.id,
        username: userData?.username || signInData.user.user_metadata?.username,
        email: signInData.user.email
      });

    } else {
      return res.status(400).json({ error: `Invalid action: ${action}` });
    }

  } catch (error) {
    console.error('Auth API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}