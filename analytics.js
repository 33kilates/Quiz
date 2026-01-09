
// netlify/functions/analytics.js

// STORAGE (In-Memory Fallback)
// NOTE: On Netlify (Serverless), this variable resets when the function goes cold.
// For permanent data, you must enable Netlify Blobs or use a Database.
// This logic is prepared for that: it uses a "store" object.

let store = {
    // Structure:
    // "2024-01-08": { visits: 5, start: 2, ... }
    // "2024-01-09": { visits: 12, start: 10, ... }
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

    // --- GET: RETURN HISTORY ---
    if (event.httpMethod === "GET") {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ history: store })
        };
    }

    // --- POST: TRACK EVENT ---
    if (event.httpMethod === "POST") {
        try {
            const body = JSON.parse(event.body || "{}");
            const step = body.step;

            if (!step) return { statusCode: 400, headers, body: "{}" };

            // Get Today's Date (Brazil Time usually implies -03:00, or simplify to UTC)
            // We'll use simple ISO date part YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];

            // Init bucket if needed
            if (!store[today]) {
                store[today] = { visits: 0, start: 0, q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, leads: 0 };
            }

            // Increment
            if (store[today][step] !== undefined) {
                store[today][step]++;
            } else {
                // Should not happen if schema matches, but safety fallback
                store[today][step] = 1;
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ ok: true, date: today, current: store[today][step] })
            };
        } catch (e) {
            console.error(e);
            return { statusCode: 400, headers, body: "Error" };
        }
    }

    return { statusCode: 405, headers, body: "Method Not Allowed" };
}
