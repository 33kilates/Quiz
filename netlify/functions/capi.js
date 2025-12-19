// netlify/functions/capi.js

export default async (req) => {
  // CORS básico (pra você chamar do browser)
  const corsHeaders = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("", { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Use POST" }), {
      status: 405,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const PIXEL_ID = "476550044818422";
  const ACCESS_TOKEN = process.env.META_CAPI_TOKEN;

  if (!ACCESS_TOKEN) {
    return new Response(JSON.stringify({ ok: false, error: "META_CAPI_TOKEN not set" }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const {
    event_name,
    event_id,
    event_source_url,
    // opcional: fbp/fbc se você enviar do front depois
    fbp,
    fbc,
  } = body || {};

  if (!event_name || !event_id) {
    return new Response(JSON.stringify({ ok: false, error: "event_name and event_id are required" }), {
      status: 400,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }

  const event_time = Math.floor(Date.now() / 1000);

  const payload = {
    data: [
      {
        event_name,
        event_time,
        event_id,
        action_source: "website",
        event_source_url: event_source_url || "",
        user_data: {
          client_user_agent: req.headers.get("user-agent") || "",
          client_ip_address:
            req.headers.get("x-nf-client-connection-ip") ||
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            "",
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {}),
        },
      },
    ],
  };

  const url = `https://graph.facebook.com/v20.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await resp.json();

  return new Response(JSON.stringify({ ok: true, meta: data }), {
    status: 200,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
};
