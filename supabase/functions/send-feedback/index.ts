// Supabase Edge Function: send-feedback
// Receives feedback from the app and sends a formatted email via Resend.
// The Resend API key is stored as a Supabase secret (never in the client).

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") || "hello@sudokitty.com";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Sudokitty Feedback <feedback@sudokitty.app>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { category, name, email, message, deviceInfo, timestamp } = await req.json();

    // Validate required fields
    if (!message || !name || !category) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: category, name, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Format HTML email
    const categoryLabel =
      {
        issue: "Issue / Bug",
        suggestion: "Suggestion",
        compliment: "Compliment",
        other: "Other",
      }[category] || category;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #FFF8F0; padding: 24px; border-radius: 12px;">
          <h2 style="color: #5D4E4E; margin: 0 0 16px 0;">New Feedback: ${categoryLabel}</h2>
          
          <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: #8B7878; font-size: 13px;">FROM</p>
            <p style="margin: 0; color: #5D4E4E; font-size: 15px; font-weight: 600;">${name}${email ? ` &lt;${email}&gt;` : ""}</p>
          </div>

          <div style="background: white; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <p style="margin: 0 0 8px 0; color: #8B7878; font-size: 13px;">MESSAGE</p>
            <p style="margin: 0; color: #5D4E4E; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="background: white; padding: 16px; border-radius: 8px;">
            <p style="margin: 0 0 8px 0; color: #8B7878; font-size: 13px;">DEVICE INFO</p>
            <table style="color: #5D4E4E; font-size: 13px; line-height: 1.8;">
              <tr><td style="padding-right: 12px; color: #8B7878;">Device</td><td>${deviceInfo?.deviceBrand ?? "Unknown"} ${deviceInfo?.deviceModel ?? ""}</td></tr>
              <tr><td style="padding-right: 12px; color: #8B7878;">OS</td><td>${deviceInfo?.osName ?? "Unknown"} ${deviceInfo?.osVersion ?? ""}</td></tr>
              <tr><td style="padding-right: 12px; color: #8B7878;">App</td><td>v${deviceInfo?.appVersion ?? "?"} (build ${deviceInfo?.buildNumber ?? "?"})</td></tr>
              <tr><td style="padding-right: 12px; color: #8B7878;">Sent</td><td>${timestamp ?? new Date().toISOString()}</td></tr>
            </table>
          </div>
        </div>
      </div>
    `;

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: SUPPORT_EMAIL,
        reply_to: email || undefined,
        subject: `[${categoryLabel}] Feedback from ${name}`,
        html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await res.json();
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
