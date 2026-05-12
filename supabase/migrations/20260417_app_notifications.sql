-- =====================================================
-- APP NOTIFICATIONS (public mobile app) — separate from the
-- internal `notifications` table used by the CRM / staff.
-- Run in Supabase SQL Editor.
-- =====================================================

-- 1. Store one push token per user (Expo push token).
--    Kept on the profile so we don't need a join on every push send.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

CREATE INDEX IF NOT EXISTS profiles_expo_push_token_idx
  ON public.profiles (expo_push_token)
  WHERE expo_push_token IS NOT NULL;

-- 2. `app_notifications` — one row per notification delivered to a user.
--    The mobile app reads its own rows to render the Notifications inbox.
CREATE TABLE IF NOT EXISTS public.app_notifications (
    id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    type       TEXT NOT NULL CHECK (type IN (
        'listing_status',       -- your submitted listing changed status
        'new_listing',          -- a new property/project matching your prefs
        'price_drop',           -- price change on a bookmarked listing
        'message',              -- agent sent you a message
        'system'                -- generic/system
    )),

    title      TEXT NOT NULL,
    body       TEXT,
    image_url  TEXT,
    data       JSONB DEFAULT '{}'::jsonb,   -- deep-link params, ids, etc.

    read_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_notifications_user_unread_idx
  ON public.app_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS app_notifications_user_created_idx
  ON public.app_notifications (user_id, created_at DESC);

-- 3. RLS — users only see their own rows.
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own_app_notifications"
  ON public.app_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_app_notifications"
  ON public.app_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_app_notifications"
  ON public.app_notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role inserts (triggers, edge functions) bypass RLS, so no
-- INSERT policy is needed — keeping the insert path restricted prevents
-- clients from spamming notifications.

-- 4. Trigger: when a listing_submission's status changes, drop a
--    notification into the owner's inbox so they see it under "My Listings"
--    and receive a push.
CREATE OR REPLACE FUNCTION public.notify_listing_status_change()
RETURNS TRIGGER AS $$
DECLARE
    status_label TEXT;
    body_text    TEXT;
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.user_id IS NOT NULL THEN
        status_label := CASE NEW.status
            WHEN 'under_review'    THEN 'is being reviewed'
            WHEN 'scheduled_visit' THEN 'has a verification visit scheduled'
            WHEN 'approved'        THEN 'has been approved'
            WHEN 'published'       THEN 'is now live on 27 Estates'
            WHEN 'rejected'        THEN 'was not approved'
            WHEN 'needs_changes'   THEN 'needs some updates from you'
            ELSE 'status updated'
        END;

        body_text := COALESCE(NEW.name, 'Your listing') || ' ' || status_label;
        IF NEW.reviewer_notes IS NOT NULL AND NEW.reviewer_notes <> '' THEN
            body_text := body_text || E'\n\n' || NEW.reviewer_notes;
        END IF;

        INSERT INTO public.app_notifications (user_id, type, title, body, data)
        VALUES (
            NEW.user_id,
            'listing_status',
            CASE NEW.status
                WHEN 'approved' THEN 'Listing approved'
                WHEN 'published' THEN 'Listing is live'
                WHEN 'rejected' THEN 'Listing not approved'
                WHEN 'needs_changes' THEN 'Changes requested'
                ELSE 'Listing update'
            END,
            body_text,
            jsonb_build_object(
                'submission_id', NEW.id,
                'status',        NEW.status,
                'route',         '/me'
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_listing_status_notify ON public.listing_submissions;
CREATE TRIGGER trg_listing_status_notify
AFTER UPDATE OF status ON public.listing_submissions
FOR EACH ROW EXECUTE FUNCTION public.notify_listing_status_change();

-- 5. Trigger: when a new property is published, notify every user whose
--    preferred_cities / preferred_types include it.
CREATE OR REPLACE FUNCTION public.notify_new_property_match()
RETURNS TRIGGER AS $$
DECLARE
    p RECORD;
BEGIN
    FOR p IN
        SELECT id FROM public.profiles
        WHERE (
            preferred_cities IS NOT NULL
            AND cardinality(preferred_cities) > 0
            AND lower(NEW.city) = ANY (SELECT lower(c) FROM unnest(preferred_cities) c)
          )
          OR (
            preferred_types IS NOT NULL
            AND cardinality(preferred_types) > 0
            AND lower(NEW.category) = ANY (SELECT lower(t) FROM unnest(preferred_types) t)
          )
    LOOP
        INSERT INTO public.app_notifications (user_id, type, title, body, image_url, data)
        VALUES (
            p.id,
            'new_listing',
            'New property in ' || COALESCE(NEW.city, 'your area'),
            NEW.title,
            (NEW.images[1])::text,
            jsonb_build_object('property_id', NEW.id, 'route', '/property/' || NEW.id)
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_property_notify ON public.properties;
CREATE TRIGGER trg_new_property_notify
AFTER INSERT ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.notify_new_property_match();

-- 6. Same for projects
CREATE OR REPLACE FUNCTION public.notify_new_project_match()
RETURNS TRIGGER AS $$
DECLARE
    p RECORD;
BEGIN
    FOR p IN
        SELECT id FROM public.profiles
        WHERE (
            preferred_cities IS NOT NULL
            AND cardinality(preferred_cities) > 0
            AND lower(NEW.city) = ANY (SELECT lower(c) FROM unnest(preferred_cities) c)
          )
          OR (
            preferred_types IS NOT NULL
            AND cardinality(preferred_types) > 0
            AND (
                lower(NEW.category) = ANY (SELECT lower(t) FROM unnest(preferred_types) t)
                OR lower(COALESCE(NEW.sub_category, '')) = ANY (SELECT lower(t) FROM unnest(preferred_types) t)
            )
          )
    LOOP
        INSERT INTO public.app_notifications (user_id, type, title, body, image_url, data)
        VALUES (
            p.id,
            'new_listing',
            'New project in ' || COALESCE(NEW.city, 'your area'),
            NEW.project_name,
            (NEW.images[1])::text,
            jsonb_build_object('project_id', NEW.id, 'route', '/project/' || NEW.id)
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_project_notify ON public.projects;
CREATE TRIGGER trg_new_project_notify
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.notify_new_project_match();

-- 7. Outbound push fan-out (Expo Push API):
--    Every new app_notifications row → pg_notify('push_notification', json)
--    An Edge Function subscribes and sends via https://exp.host/--/api/v2/push/send
--    (Expo Push doesn't require an API key; the device's ExponentPushToken is enough.)
CREATE OR REPLACE FUNCTION public.fanout_push_notification()
RETURNS TRIGGER AS $$
DECLARE
    token TEXT;
BEGIN
    SELECT expo_push_token INTO token
      FROM public.profiles WHERE id = NEW.user_id;

    IF token IS NOT NULL THEN
        PERFORM pg_notify(
            'push_notification',
            jsonb_build_object(
                'to',    token,
                'title', NEW.title,
                'body',  NEW.body,
                'data',  NEW.data
            )::text
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_fanout_push_notification ON public.app_notifications;
CREATE TRIGGER trg_fanout_push_notification
AFTER INSERT ON public.app_notifications
FOR EACH ROW EXECUTE FUNCTION public.fanout_push_notification();

SELECT 'app_notifications table + triggers configured successfully' AS message;
