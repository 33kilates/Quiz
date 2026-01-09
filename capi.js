// netlify/functions/capi.js
export async function handler(event) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Content-Type": "application/json",
  };

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "Use POST" }),
    };
  }

  const PIXEL_ID = "476550044818422";
  const ACCESS_TOKEN = process.env.META_CAPI_TOKEN;

  if (!ACCESS_TOKEN) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "META_CAPI_TOKEN not set" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "Invalid JSON" }),
    };
  }

  const { event_name, event_id, event_source_url, fbp, fbc } = body || {};

  if (!event_name || !event_id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "event_name and event_id are required" }),
    };
  }

  const event_time = Math.floor(Date.now() / 1000);

  // IP/UA (Netlify geralmente coloca o IP real aqui)
  const clientIp =
    event.headers["x-nf-client-connection-ip"] ||
    (event.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    "";

  const userAgent = event.headers["user-agent"] || "";

  const payload = {
    data: [
      {
        event_name,
        event_time,
        event_id,
        action_source: "website",
        event_source_url: event_source_url || "",
        user_data: {
          client_ip_address: clientIp,
          client_user_agent: userAgent,
          ...(fbp ? { fbp } : {}),
          ...(fbc ? { fbc } : {}),
        },
      },
    ],
  };

  const url = `https://graph.facebook.com/v20.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  let resp, data;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    data = await resp.json();
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "Fetch to Meta failed", details: String(err) }),
    };
  }

  // ✅ NÃO mascarar erro
  if (!resp.ok || data?.error) {
    return {
      statusCode: 502,
      headers: corsHeaders,
      body: JSON.stringify({
        ok: false,
        error: "Meta CAPI returned error",
        status: resp.status,
        meta: data,
      }),
    };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ ok: true, meta: data }),
  };
}
