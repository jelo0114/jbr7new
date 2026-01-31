-- Supabase (PostgreSQL) - Notifications table (fresh setup)
-- Run in Supabase SQL Editor after deleting your existing notifications table

-- Drop existing table (run this first if you want a clean refresh)
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('order_status', 'cart_reminder')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_id INT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- RLS: Must allow SELECT for notifications panel to fetch
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read notifications" ON notifications;
CREATE POLICY "Allow read notifications" ON notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert notifications" ON notifications;
CREATE POLICY "Allow insert notifications" ON notifications FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update notifications" ON notifications;
CREATE POLICY "Allow update notifications" ON notifications FOR UPDATE USING (true) WITH CHECK (true);
