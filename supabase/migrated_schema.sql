-- =====================================================
-- 27 ESTATES - MIGRATED SCHEMA
-- Generated: 2026-03-16T05:15:35.443Z
-- =====================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT uuid_generate_v4() NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  image TEXT,
  role TEXT DEFAULT 'Agent'::text,
  bio TEXT,
  properties_count INTEGER DEFAULT 0,
  rating NUMERIC(2,1),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT agents_pkey PRIMARY KEY (id),
  CONSTRAINT agents_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS owners (
  id UUID DEFAULT uuid_generate_v4() NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  company TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT owners_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS developers (
  id UUID DEFAULT uuid_generate_v4() NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  logo TEXT,
  description TEXT,
  website TEXT,
  projects_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT developers_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID NOT NULL,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'admin'::text, 'agent'::text, 'super_admin'::text])))
);

CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT uuid_generate_v4() NOT NULL,
  property_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  price_per_sqft NUMERIC,
  location TEXT NOT NULL,
  address TEXT,
  bedrooms INTEGER NOT NULL,
  bathrooms INTEGER NOT NULL,
  sqft INTEGER NOT NULL,
  lot_size INTEGER,
  floors INTEGER,
  rooms INTEGER,
  property_type TEXT NOT NULL,
  category TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  agent_id UUID,
  images TEXT[] DEFAULT '{}'::text[],
  amenities JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  video_url TEXT,
  floor_plans JSONB,
  price_text TEXT,
  deposit_amount TEXT,
  maintenance_charges TEXT,
  carpet_area INTEGER,
  built_up_area INTEGER,
  plot_size INTEGER,
  total_rooms NUMERIC,
  balconies INTEGER,
  parking_count INTEGER,
  city TEXT,
  street TEXT,
  landmark TEXT,
  flat_no TEXT,
  building_name TEXT,
  floor_number TEXT,
  total_floors TEXT,
  sub_category TEXT,
  furnishing TEXT,
  facing TEXT,
  ownership TEXT,
  possession_status TEXT,
  property_age TEXT,
  flooring TEXT,
  transaction_type TEXT,
  project_id UUID,
  project_name TEXT,
  owner_name TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  status TEXT DEFAULT 'Available'::text,
  is_verified BOOLEAN DEFAULT false,
  ref_number TEXT,
  source TEXT,
  pincode TEXT,
  state TEXT,
  area TEXT,
  country TEXT DEFAULT 'India'::text,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  display_name TEXT,
  survey_number TEXT,
  survey_name TEXT,
  request_date DATE DEFAULT CURRENT_DATE,
  visibility TEXT DEFAULT 'Public'::text,
  branch TEXT,
  folder TEXT,
  keywords TEXT[],
  key_holder TEXT,
  refer_by TEXT,
  suitable_for TEXT[],
  available_from DATE,
  unique_feature TEXT,
  remarks TEXT,
  commercial_details JSONB DEFAULT '{}'::jsonb,
  warehouse_details JSONB DEFAULT '{}'::jsonb,
  pricing_details JSONB DEFAULT '{}'::jsonb,
  channel TEXT,
  owner_id UUID,
  furnished_status TEXT,
  connectivity JSONB,
  is_rera_approved BOOLEAN DEFAULT false NOT NULL,
  is_oc_approved BOOLEAN DEFAULT false NOT NULL,
  floor_details JSONB,
  direction TEXT,
  CONSTRAINT properties_pkey PRIMARY KEY (id),
  CONSTRAINT properties_category_check CHECK ((category = ANY (ARRAY['Apartment'::text, 'House'::text, 'Villa'::text, 'Bungalow'::text, 'Row Villa'::text, 'Plot'::text, 'Commercial'::text, 'Farmhouse'::text, 'Penthouse'::text, 'Studio'::text, 'Duplex'::text, 'Office'::text, 'Offices'::text, 'Warehouse'::text, 'Other'::text]))),
  CONSTRAINT properties_property_type_check CHECK ((property_type = ANY (ARRAY['Sale'::text, 'Rent'::text]))),
  CONSTRAINT properties_visibility_check CHECK ((visibility = ANY (ARRAY['Public'::text, 'Private'::text, 'Branch'::text, 'Protected'::text]))),
  CONSTRAINT properties_property_id_key UNIQUE (property_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT uuid_generate_v4() NOT NULL,
  project_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  title TEXT,
  description TEXT,
  specifications TEXT,
  rera_number TEXT,
  developer_id UUID,
  developer_name TEXT,
  address TEXT,
  location TEXT,
  city TEXT,
  landmark TEXT,
  pincode TEXT,
  min_price TEXT,
  max_price TEXT,
  min_price_numeric NUMERIC,
  max_price_numeric NUMERIC,
  min_area NUMERIC,
  max_area NUMERIC,
  property_type TEXT,
  bhk_options TEXT[],
  transaction_type TEXT,
  status TEXT DEFAULT 'Available'::text,
  launch_date TEXT,
  possession_date TEXT,
  images TEXT[] DEFAULT '{}'::text[],
  brochure_url TEXT,
  video_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_rera_approved BOOLEAN DEFAULT false,
  employee_name TEXT,
  employee_phone TEXT,
  employee_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  state TEXT,
  country TEXT DEFAULT 'India'::text,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  towers_data JSONB DEFAULT '[]'::jsonb,
  project_plan JSONB DEFAULT '[]'::jsonb,
  specifications_complex JSONB DEFAULT '[]'::jsonb,
  amenities JSONB DEFAULT '[]'::jsonb,
  assigned_agent_id UUID,
  category TEXT,
  sub_category TEXT,
  total_units INTEGER,
  price_per_sqft NUMERIC,
  master_plan_image TEXT,
  floor_plans JSONB,
  connectivity JSONB,
  highlights JSONB,
  ad_card_image TEXT,
  show_ad_on_home BOOLEAN DEFAULT false,
  developer_image TEXT,
  developer_description TEXT,
  is_oc_approved BOOLEAN DEFAULT false NOT NULL,
  section TEXT DEFAULT 'residential'::text NOT NULL,
  direction TEXT,
  listing_type TEXT DEFAULT 'For Sale'::text,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_listing_type_check CHECK ((listing_type = ANY (ARRAY['For Sale'::text, 'For Rent'::text, 'For Lease'::text]))),
  CONSTRAINT chk_projects_section CHECK ((section = ANY (ARRAY['residential'::text, 'commercial'::text, 'warehouse'::text]))),
  CONSTRAINT projects_project_id_key UNIQUE (project_id)
);

CREATE TABLE IF NOT EXISTS blogs (
  id UUID DEFAULT uuid_generate_v4() NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_image TEXT,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  reading_time TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  category TEXT,
  CONSTRAINT blogs_pkey PRIMARY KEY (id),
  CONSTRAINT blogs_slug_key UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT uuid_generate_v4() NOT NULL,
  property_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  project_id UUID,
  CONSTRAINT inquiries_pkey PRIMARY KEY (id),
  CONSTRAINT inquiries_status_check CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'replied'::text, 'closed'::text])))
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'manual'::text NOT NULL,
  source_campaign TEXT,
  source_ad_id TEXT,
  source_form_id TEXT,
  source_raw_data JSONB,
  status TEXT DEFAULT 'new'::text NOT NULL,
  priority TEXT DEFAULT 'warm'::text NOT NULL,
  assigned_agent_id UUID,
  property_interest UUID,
  project_interest UUID,
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_location TEXT,
  property_type TEXT,
  notes TEXT,
  tags TEXT[] DEFAULT '{}'::text[],
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  lost_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT leads_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  lead_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_by TEXT DEFAULT 'system'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT lead_activities_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS lead_tasks (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  lead_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT lead_tasks_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID DEFAULT uuid_generate_v4() NOT NULL,
  user_id UUID NOT NULL,
  property_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  project_id UUID,
  CONSTRAINT user_bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT unique_user_project UNIQUE (user_id, project_id),
  CONSTRAINT user_bookmarks_user_id_property_id_key UNIQUE (user_id, property_id)
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id),
  CONSTRAINT newsletter_subscribers_email_key UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS ad_connectors (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  platform TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  webhook_url TEXT,
  last_synced_at TIMESTAMPTZ,
  leads_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ad_connectors_pkey PRIMARY KEY (id),
  CONSTRAINT ad_connectors_platform_key UNIQUE (platform)
);

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  lead_id UUID,
  template_id UUID,
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending'::text,
  scheduled_for TIMESTAMPTZ DEFAULT now() NOT NULL,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT email_queue_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  lead_id UUID,
  template_id UUID,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent'::text,
  resend_id TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  CONSTRAINT email_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}'::text[],
  category TEXT DEFAULT 'general'::text,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT email_templates_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  platform TEXT NOT NULL,
  event_type TEXT,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'received'::text,
  error_message TEXT,
  lead_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT webhook_logs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS career_openings (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  title TEXT NOT NULL,
  department TEXT DEFAULT 'General'::text NOT NULL,
  location TEXT DEFAULT 'Bangalore, India'::text NOT NULL,
  type TEXT DEFAULT 'Full-Time'::text NOT NULL,
  experience TEXT,
  description TEXT,
  responsibilities TEXT[] DEFAULT '{}'::text[],
  requirements TEXT[] DEFAULT '{}'::text[],
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT career_openings_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS career_applications (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  opening_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  resume_url TEXT,
  cover_letter TEXT,
  current_company TEXT,
  experience_years TEXT,
  status TEXT DEFAULT 'new'::text NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT career_applications_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  visitor_id TEXT NOT NULL,
  lead_id UUID,
  status TEXT DEFAULT 'active'::text,
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() NOT NULL,
  session_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS property_submissions (
  id UUID DEFAULT uuid_generate_v4() NOT NULL,
  user_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  property_type TEXT,
  deal_type TEXT,
  property_details TEXT,
  expected_price NUMERIC,
  city TEXT,
  images TEXT[] DEFAULT '{}'::text[],
  status TEXT DEFAULT 'new'::text,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  property_category TEXT,
  CONSTRAINT property_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT property_submissions_property_type_check CHECK ((property_type = ANY (ARRAY['Sale'::text, 'Rent'::text]))),
  CONSTRAINT property_submissions_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'converted'::text, 'rejected'::text])))
);

-- =====================================================
-- FOREIGN KEYS
-- =====================================================

ALTER TABLE career_applications ADD CONSTRAINT career_applications_opening_id_fkey
  FOREIGN KEY (opening_id) REFERENCES career_openings(id) ON DELETE CASCADE;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;
ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE email_logs ADD CONSTRAINT email_logs_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;
ALTER TABLE email_logs ADD CONSTRAINT email_logs_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL;
ALTER TABLE email_queue ADD CONSTRAINT email_queue_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
ALTER TABLE email_queue ADD CONSTRAINT email_queue_template_id_fkey
  FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE SET NULL;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE inquiries ADD CONSTRAINT inquiries_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;
ALTER TABLE lead_activities ADD CONSTRAINT lead_activities_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
ALTER TABLE lead_tasks ADD CONSTRAINT lead_tasks_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES agents(id) ON DELETE SET NULL;
ALTER TABLE lead_tasks ADD CONSTRAINT lead_tasks_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;
ALTER TABLE leads ADD CONSTRAINT leads_assigned_agent_id_fkey
  FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL;
ALTER TABLE leads ADD CONSTRAINT leads_property_interest_fkey
  FOREIGN KEY (property_interest) REFERENCES properties(id) ON DELETE SET NULL;
ALTER TABLE leads ADD CONSTRAINT leads_project_interest_fkey
  FOREIGN KEY (project_interest) REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE projects ADD CONSTRAINT projects_developer_id_fkey
  FOREIGN KEY (developer_id) REFERENCES developers(id);
ALTER TABLE projects ADD CONSTRAINT projects_assigned_agent_id_fkey
  FOREIGN KEY (assigned_agent_id) REFERENCES agents(id) ON DELETE SET NULL;
ALTER TABLE properties ADD CONSTRAINT properties_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL;
ALTER TABLE properties ADD CONSTRAINT properties_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id);
ALTER TABLE properties ADD CONSTRAINT properties_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES agents(id);
ALTER TABLE user_bookmarks ADD CONSTRAINT user_bookmarks_property_id_fkey
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
ALTER TABLE user_bookmarks ADD CONSTRAINT user_bookmarks_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE webhook_logs ADD CONSTRAINT webhook_logs_lead_id_fkey
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_blogs_published ON public.blogs USING btree (published_at) WHERE (published_at IS NOT NULL);
CREATE INDEX idx_blogs_slug ON public.blogs USING btree (slug);
CREATE INDEX idx_career_applications_opening ON public.career_applications USING btree (opening_id);
CREATE INDEX idx_career_applications_status ON public.career_applications USING btree (status);
CREATE INDEX idx_career_openings_active ON public.career_openings USING btree (is_active);
CREATE INDEX idx_chat_messages_session ON public.chat_messages USING btree (session_id);
CREATE INDEX idx_chat_sessions_visitor ON public.chat_sessions USING btree (visitor_id);
CREATE INDEX idx_email_queue_status ON public.email_queue USING btree (status, scheduled_for) WHERE (status = 'pending'::text);
CREATE INDEX idx_inquiries_status ON public.inquiries USING btree (status);
CREATE INDEX idx_lead_activities_created_at ON public.lead_activities USING btree (created_at DESC);
CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities USING btree (lead_id);
CREATE INDEX idx_lead_tasks_due_date ON public.lead_tasks USING btree (due_date) WHERE (is_completed = false);
CREATE INDEX idx_lead_tasks_lead_id ON public.lead_tasks USING btree (lead_id);
CREATE INDEX idx_leads_assigned_agent ON public.leads USING btree (assigned_agent_id);
CREATE INDEX idx_leads_created_at ON public.leads USING btree (created_at DESC);
CREATE INDEX idx_leads_email ON public.leads USING btree (email) WHERE (email IS NOT NULL);
CREATE INDEX idx_leads_next_follow_up ON public.leads USING btree (next_follow_up_at) WHERE (next_follow_up_at IS NOT NULL);
CREATE INDEX idx_leads_phone ON public.leads USING btree (phone) WHERE (phone IS NOT NULL);
CREATE INDEX idx_leads_priority ON public.leads USING btree (priority);
CREATE INDEX idx_leads_source ON public.leads USING btree (source);
CREATE INDEX idx_leads_status ON public.leads USING btree (status);
CREATE INDEX idx_newsletter_active ON public.newsletter_subscribers USING btree (is_active);
CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers USING btree (email);
CREATE INDEX idx_owners_name ON public.owners USING btree (name);
CREATE INDEX idx_projects_assigned_agent ON public.projects USING btree (assigned_agent_id);
CREATE INDEX idx_projects_city ON public.projects USING btree (city);
CREATE INDEX idx_projects_developer ON public.projects USING btree (developer_name);
CREATE INDEX idx_projects_direction ON public.projects USING btree (direction);
CREATE INDEX idx_projects_featured ON public.projects USING btree (is_featured) WHERE (is_featured = true);
CREATE INDEX idx_projects_section ON public.projects USING btree (section);
CREATE INDEX projects_listing_type_idx ON public.projects USING btree (listing_type);
CREATE INDEX idx_properties_branch ON public.properties USING btree (branch);
CREATE INDEX idx_properties_category ON public.properties USING btree (category);
CREATE INDEX idx_properties_city ON public.properties USING btree (city);
CREATE INDEX idx_properties_featured ON public.properties USING btree (is_featured) WHERE (is_featured = true);
CREATE INDEX idx_properties_location ON public.properties USING btree (location);
CREATE INDEX idx_properties_owner ON public.properties USING btree (owner_id);
CREATE INDEX idx_properties_type ON public.properties USING btree (property_type);
CREATE INDEX idx_properties_visibility ON public.properties USING btree (visibility);
CREATE INDEX idx_bookmarks_user ON public.user_bookmarks USING btree (user_id);
CREATE INDEX idx_user_bookmarks_property_id ON public.user_bookmarks USING btree (property_id);
CREATE INDEX idx_user_bookmarks_user_id ON public.user_bookmarks USING btree (user_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs USING btree (created_at DESC);
CREATE INDEX idx_webhook_logs_platform ON public.webhook_logs USING btree (platform);

-- =====================================================
-- FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, first_name, last_name, phone, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), public.profiles.first_name),
        last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), public.profiles.last_name),
        phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
        updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_staff()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','agent'));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

-- =====================================================
-- TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS ad_connectors_updated_at ON ad_connectors;
CREATE TRIGGER ad_connectors_updated_at
  BEFORE UPDATE ON ad_connectors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS email_templates_updated_at ON email_templates;
CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_owners_updated_at ON owners;
CREATE TRIGGER update_owners_updated_at
  BEFORE UPDATE ON owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auth trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE ad_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON ad_connectors;
CREATE POLICY "Service role full access" ON ad_connectors
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Admins manage agents" ON agents;
CREATE POLICY "Admins manage agents" ON agents
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (is_admin_or_super_admin())
  WITH CHECK (is_admin_or_super_admin())
;

DROP POLICY IF EXISTS "Public read agents" ON agents;
CREATE POLICY "Public read agents" ON agents
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true)
;

DROP POLICY IF EXISTS "Admins and Super Admins can manage blogs" ON blogs;
CREATE POLICY "Admins and Super Admins can manage blogs" ON blogs
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (is_admin_or_super_admin())
;

DROP POLICY IF EXISTS "Anyone can view published blogs" ON blogs;
CREATE POLICY "Anyone can view published blogs" ON blogs
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((published_at IS NOT NULL))
;

DROP POLICY IF EXISTS "Admins can manage applications" ON career_applications;
CREATE POLICY "Admins can manage applications" ON career_applications
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'agent'::text]))))))
;

DROP POLICY IF EXISTS "Anyone can submit applications" ON career_applications;
CREATE POLICY "Anyone can submit applications" ON career_applications
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Admins can manage openings" ON career_openings;
CREATE POLICY "Admins can manage openings" ON career_openings
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))))
;

DROP POLICY IF EXISTS "Anyone can view active openings" ON career_openings;
CREATE POLICY "Anyone can view active openings" ON career_openings
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((is_active = true))
;

DROP POLICY IF EXISTS "Service role full access" ON chat_messages;
CREATE POLICY "Service role full access" ON chat_messages
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Service role full access" ON chat_sessions;
CREATE POLICY "Service role full access" ON chat_sessions
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Public read developers" ON developers;
CREATE POLICY "Public read developers" ON developers
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true)
;

DROP POLICY IF EXISTS "Staff manage developers" ON developers;
CREATE POLICY "Staff manage developers" ON developers
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (is_staff())
  WITH CHECK (is_staff())
;

DROP POLICY IF EXISTS "Service role full access" ON email_logs;
CREATE POLICY "Service role full access" ON email_logs
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Service role full access" ON email_queue;
CREATE POLICY "Service role full access" ON email_queue
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Service role full access" ON email_templates;
CREATE POLICY "Service role full access" ON email_templates
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Admins delete inquiries" ON inquiries;
CREATE POLICY "Admins delete inquiries" ON inquiries
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (is_admin_or_super_admin())
;

DROP POLICY IF EXISTS "Anyone submit inquiry" ON inquiries;
CREATE POLICY "Anyone submit inquiry" ON inquiries
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Staff read inquiries" ON inquiries;
CREATE POLICY "Staff read inquiries" ON inquiries
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (is_staff())
;

DROP POLICY IF EXISTS "Staff update inquiries" ON inquiries;
CREATE POLICY "Staff update inquiries" ON inquiries
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (is_staff())
  WITH CHECK (is_staff())
;

DROP POLICY IF EXISTS "Service role full access" ON lead_activities;
CREATE POLICY "Service role full access" ON lead_activities
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Service role full access" ON lead_tasks;
CREATE POLICY "Service role full access" ON lead_tasks
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Service role full access" ON leads;
CREATE POLICY "Service role full access" ON leads
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Service role can manage subscribers" ON newsletter_subscribers;
CREATE POLICY "Service role can manage subscribers" ON newsletter_subscribers
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Staff manage owners" ON owners;
CREATE POLICY "Staff manage owners" ON owners
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (is_staff())
  WITH CHECK (is_staff())
;

DROP POLICY IF EXISTS "Staff read owners" ON owners;
CREATE POLICY "Staff read owners" ON owners
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (is_staff())
;

DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles" ON profiles
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (is_admin_or_super_admin())
;

DROP POLICY IF EXISTS "Users read own profile" ON profiles;
CREATE POLICY "Users read own profile" ON profiles
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = id))
;

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id))
;

DROP POLICY IF EXISTS "Public read projects" ON projects;
CREATE POLICY "Public read projects" ON projects
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true)
;

DROP POLICY IF EXISTS "Staff manage projects" ON projects;
CREATE POLICY "Staff manage projects" ON projects
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (is_staff())
  WITH CHECK (is_staff())
;

DROP POLICY IF EXISTS "Public read properties" ON properties;
CREATE POLICY "Public read properties" ON properties
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true)
;

DROP POLICY IF EXISTS "Staff manage properties" ON properties;
CREATE POLICY "Staff manage properties" ON properties
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (is_staff())
  WITH CHECK (is_staff())
;

DROP POLICY IF EXISTS "Admins delete submissions" ON property_submissions;
CREATE POLICY "Admins delete submissions" ON property_submissions
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (is_admin_or_super_admin())
;

DROP POLICY IF EXISTS "Anyone submit property" ON property_submissions;
CREATE POLICY "Anyone submit property" ON property_submissions
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (true)
;

DROP POLICY IF EXISTS "Staff update submissions" ON property_submissions;
CREATE POLICY "Staff update submissions" ON property_submissions
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (is_staff())
  WITH CHECK (is_staff())
;

DROP POLICY IF EXISTS "Users or staff read submissions" ON property_submissions;
CREATE POLICY "Users or staff read submissions" ON property_submissions
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((auth.uid() = user_id) OR is_staff()))
;

DROP POLICY IF EXISTS "Users can delete own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can delete own bookmarks" ON user_bookmarks
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id))
;

DROP POLICY IF EXISTS "Users can insert own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can insert own bookmarks" ON user_bookmarks
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id))
;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON user_bookmarks;
CREATE POLICY "Users can view own bookmarks" ON user_bookmarks
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id))
;

DROP POLICY IF EXISTS "Service role full access" ON webhook_logs;
CREATE POLICY "Service role full access" ON webhook_logs
  AS PERMISSIVE
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true)
;

