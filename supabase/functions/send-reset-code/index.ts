import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user exists
    const { data: userList } = await supabase.auth.admin.listUsers();
    const user = userList?.users?.find(
      (u: any) => u.email?.toLowerCase() === normalizedEmail
    );
    if (!user) {
      // Don't reveal whether email exists — still return success
      return new Response(
        JSON.stringify({ success: true, message: "If the email exists, a code was sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete old unverified codes for this email
    await supabase
      .from("verification_codes")
      .delete()
      .eq("email", normalizedEmail)
      .eq("verified", false);

    // Generate 4-digit code
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("verification_codes").insert({
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
    });

    // Send via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "onboarding@resend.dev";

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "27 Estates <" + FROM_EMAIL + ">",
        to: normalizedEmail,
        subject: code + " — Reset your 27 Estates password",
        html: '<div style="font-family:Helvetica Neue,Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px"><div style="text-align:center;margin-bottom:32px"><h1 style="color:#183C38;font-size:24px;font-weight:700;margin:0">27 Estates</h1></div><p style="color:#333;font-size:16px;line-height:1.5;margin-bottom:8px">Hi there,</p><p style="color:#333;font-size:16px;line-height:1.5;margin-bottom:24px">Use the code below to reset your password:</p><div style="background:#F5F4F8;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px"><span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#183C38">' + code + '</span></div><p style="color:#888;font-size:13px;line-height:1.5">This code expires in 10 minutes. If you didn\'t request a password reset, ignore this email.</p><hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px"><p style="color:#aaa;font-size:11px;text-align:center">27 Estates — Luxury Real Estate</p></div>',
      }),
    });

    return new Response(
      JSON.stringify({ success: true, message: "Reset code sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
