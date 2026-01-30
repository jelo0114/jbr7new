-- Supabase (PostgreSQL) reviews table
-- Run this in Supabase Dashboard → SQL Editor so reviews work with get_product_reviews, submit_review, and profile user-reviews.

-- Create reviews table (matches supabse-conn/index.js: getProductReviews, submitReview, getUserReviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  product_title TEXT NOT NULL,
  item_id TEXT NOT NULL,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5),
  comment TEXT NULL,
  product_image TEXT NULL,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  helpfulness_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL,
  UNIQUE (user_id, item_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_item_id ON public.reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_title ON public.reviews(product_title);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Allow API (anon key) to insert/select/update (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert reviews" ON public.reviews;
CREATE POLICY "Allow insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select reviews" ON public.reviews;
CREATE POLICY "Allow select reviews" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow update reviews" ON public.reviews;
CREATE POLICY "Allow update reviews" ON public.reviews FOR UPDATE USING (true);
