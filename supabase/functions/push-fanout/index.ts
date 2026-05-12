/// <reference types="https://esm.sh/v135/@supabase/functions-js/src/edge-runtime.d.ts" />

/**
 * push-fanout — Supabase Edge Function
 *
 * Triggered by a Database Webhook on `public.app_notifications` AFTER INSERT.
 * Reads the target user's `expo_push_token` and sends a push via the Expo
 * Push API. Expo Push does NOT require a server-side API key — the device's
 * ExponentPushToken IS the authentication.
 *
 * Setup
 * -----
 * 1. Deploy:   supabase functions deploy push-fanout --no-verify-jwt
 * 2. In Supabase Dashboard → Database → Webhooks → New hook:
 *      Table:    app_notifications
 *      Events:   INSERT
 *      Type:     Supabase Edge Functions
 *      Function: push-fanout
 * 3. (Optional) Set secrets if you want to restrict:
 *      supabase secrets set PUSH_FANOUT_SHARED_SECRET=<random_string>
 *    then configure the webhook to include that secret as an HTTP header.
 *
 * Expo Push docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface AppNotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  image_url: string | null;
  data: Record<string, unknown> | null;
}

interface DbWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: AppNotificationRow;
  old_record?: AppNotificationRow;
  schema: string;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

function isExpoPushToken(token: string): boolean {
  return typeof token === 'string' && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Optional shared-secret guard
  const expectedSecret = Deno.env.get('PUSH_FANOUT_SHARED_SECRET');
  if (expectedSecret) {
    const got = req.headers.get('x-push-secret');
    if (got !== expectedSecret) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  let payload: DbWebhookPayload;
  try { payload = await req.json(); } catch { return new Response('Bad JSON', { status: 400 }); }

  if (payload.type !== 'INSERT' || payload.table !== 'app_notifications') {
    return new Response(JSON.stringify({ skipped: true }), { headers: { 'content-type': 'application/json' } });
  }

  const row = payload.record;
  if (!row?.user_id) return new Response('No user_id', { status: 400 });

  // Read the token via service role so RLS doesn't block us
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .eq('id', row.user_id)
    .maybeSingle();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  const token = profile?.expo_push_token;
  if (!token || !isExpoPushToken(token)) {
    return new Response(JSON.stringify({ skipped: true, reason: 'no_token' }), { headers: { 'content-type': 'application/json' } });
  }

  const message = {
    to: token,
    sound: 'default',
    title: row.title,
    body:  row.body ?? '',
    data:  { ...(row.data ?? {}), notification_id: row.id, type: row.type },
    priority: 'high',
    channelId: 'default', // matches the Android channel set in lib/push.ts
  };

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    const result = await res.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ ok: true, expo: result }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({ ok: false, error: errMsg }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
});
