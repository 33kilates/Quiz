
// netlify/functions/analytics.js
// NOTE: For persistent storage in production, enable Netlify Blobs or connect a DB.
// This is an in-memory fallback pattern that works efficiently for demo/short-term sessions in lambda containers.

let memoryStats = {
    visits: 0,
    start: 0,
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
    q5: 0,
    q6: 0,
    leads: 0
};

export async function handler(event) {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json"
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers, body: "" };
    }

    // GET: Return stats
    if (event.httpMethod === "GET") {
        // In a real implementation, fetch from Blob store here
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ stats: memoryStats })
        };
    }

    // POST: Track event
    if (event.httpMethod === "POST") {
        try {
            const body = JSON.parse(event.body || "{}");
            const step = body.step; // 'visits', 'start', 'q1', etc.

            if (step && memoryStats.hasOwnProperty(step)) {
                memoryStats[step]++;
                // In real implementation, write to Blob store here
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ ok: true, current: memoryStats[step] })
            };
        } catch (e) {
            return { statusCode: 400, headers, body: "{}" };
        }
    }

    return { statusCode: 405, headers, body: "Method Not Allowed" };
}
