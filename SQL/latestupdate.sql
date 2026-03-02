-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_users (
  id bigint NOT NULL DEFAULT nextval('admin_users_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  name character varying NOT NULL DEFAULT 'Admin'::character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.items (
  id bigint NOT NULL DEFAULT nextval('items_id_seq'::regclass),
  item_id character varying NOT NULL UNIQUE,
  title character varying NOT NULL,
  description text,
  price numeric NOT NULL,
  image character varying,
  images jsonb,
  category character varying,
  rating numeric DEFAULT 0.00,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  quantity integer NOT NULL DEFAULT 99,
  CONSTRAINT items_pkey PRIMARY KEY (id)
);
CREATE TABLE public.login_history (
  id bigint NOT NULL DEFAULT nextval('login_history_id_seq'::regclass),
  user_id bigint NOT NULL,
  ip_address character varying,
  user_agent character varying,
  login_time timestamp with time zone NOT NULL DEFAULT now(),
  logout_time timestamp with time zone,
  session_duration integer,
  CONSTRAINT login_history_pkey PRIMARY KEY (id),
  CONSTRAINT login_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notification_preferences (
  id bigint NOT NULL DEFAULT nextval('notification_preferences_id_seq'::regclass),
  user_id bigint NOT NULL UNIQUE,
  order_status boolean DEFAULT true,
  cart_reminder boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id integer NOT NULL,
  notification_type text NOT NULL CHECK (notification_type = ANY (ARRAY['order_status'::text, 'cart_reminder'::text])),
  title character varying NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  related_id integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.order_items (
  id bigint NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id bigint NOT NULL,
  item_name character varying NOT NULL,
  item_image character varying,
  item_price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  size character varying,
  color character varying,
  line_total numeric NOT NULL,
  status character varying NOT NULL DEFAULT 'processing'::character varying,
  status_updated_at timestamp with time zone,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.orders (
  id bigint NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  user_id bigint NOT NULL,
  order_number character varying NOT NULL UNIQUE,
  status character varying NOT NULL DEFAULT 'processing'::character varying,
  status_updated_at timestamp with time zone,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  subtotal numeric NOT NULL DEFAULT 0.00,
  shipping numeric NOT NULL DEFAULT 0.00,
  total numeric NOT NULL DEFAULT 0.00,
  payment_method character varying,
  courier_service character varying,
  customer_email character varying,
  customer_phone character varying,
  shipping_address text,
  can_cancel_after timestamp with time zone,
  items_json jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.receipts (
  id bigint NOT NULL DEFAULT nextval('receipts_id_seq'::regclass),
  user_id bigint NOT NULL,
  order_id bigint,
  order_number text,
  payment_provider text,
  payment_provider_id text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'PHP'::text,
  status text NOT NULL DEFAULT 'succeeded'::text,
  captured_at timestamp with time zone NOT NULL DEFAULT now(),
  raw_response text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT receipts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reviews (
  id bigint NOT NULL DEFAULT nextval('reviews_id_seq'::regclass),
  user_id bigint NOT NULL,
  product_title text NOT NULL,
  item_id text NOT NULL,
  rating numeric NOT NULL CHECK (rating >= 0.5 AND rating <= 5::numeric),
  comment text,
  product_image text,
  is_verified_purchase boolean NOT NULL DEFAULT false,
  helpfulness_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT reviews_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reward_tiers (
  id bigint NOT NULL DEFAULT nextval('reward_tiers_id_seq'::regclass),
  points_required integer NOT NULL UNIQUE,
  discount_percent integer NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 100),
  label text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reward_tiers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.saved_items (
  id bigint NOT NULL DEFAULT nextval('saved_items_id_seq'::regclass),
  user_id bigint NOT NULL,
  item_id character varying NOT NULL,
  title character varying,
  price numeric,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT saved_items_pkey PRIMARY KEY (id),
  CONSTRAINT saved_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.shipping_addresses (
  id bigint NOT NULL DEFAULT nextval('shipping_addresses_id_seq'::regclass),
  user_id bigint NOT NULL,
  address_type character varying NOT NULL DEFAULT 'home'::character varying CHECK (address_type::text = ANY (ARRAY['home'::character varying, 'office'::character varying]::text[])),
  is_default boolean NOT NULL DEFAULT false,
  first_name character varying,
  middle_name character varying,
  last_name character varying,
  recipient_name character varying,
  company_name character varying,
  mobile_number character varying,
  alternate_number character varying,
  office_phone character varying,
  email_address character varying,
  house_unit_number character varying,
  building_name character varying,
  floor_unit_number character varying,
  street_name character varying,
  subdivision_village character varying,
  barangay character varying,
  city_municipality character varying,
  province_state character varying,
  postal_zip_code character varying,
  country character varying NOT NULL DEFAULT 'Philippines'::character varying,
  landmark_delivery_notes text,
  office_hours character varying,
  additional_instructions text,
  latitude numeric,
  longitude numeric,
  formatted_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shipping_addresses_pkey PRIMARY KEY (id),
  CONSTRAINT shipping_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_coupons (
  id bigint NOT NULL DEFAULT nextval('user_coupons_id_seq'::regclass),
  user_id bigint NOT NULL,
  points_spent integer NOT NULL,
  discount_percent integer NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 100),
  used boolean NOT NULL DEFAULT false,
  order_id bigint,
  order_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  used_at timestamp with time zone,
  CONSTRAINT user_coupons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_preferences (
  id bigint NOT NULL DEFAULT nextval('user_preferences_id_seq'::regclass),
  user_id bigint NOT NULL UNIQUE,
  default_payment character varying,
  default_courier character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  username character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  points integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  profile_picture text,
  phone character varying,
  password text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);