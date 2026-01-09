// netlify/functions/analytics.js
import { getStore } from "@netlify/blobs";

// Initialize Blob Store
// We use a store named 'analytics'
const getAnalyticsStore = () => getStore({ name: "analytics", consistency: "strong" });

export async function handler(event) {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json"
    };

    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 204, headers, body: "" };
    }

    try {
        let store;
        let isPersistent = true;

        try {
            store = getAnalyticsStore();
            // Test connection with a lightweight list
            await store.list({ prefix: "test" });
        } catch (blobErr) {
            console.warn("BLOBS NOT CONFIGURED. Falling back to in-memory (volatile). Error:", blobErr.message);
            isPersistent = false;
        }

        const today = new Date().toISOString().split('T')[0];
        const key = `daily:${today}`;

        // --- GET: RETURN HISTORY ---
        if (event.httpMethod === "GET") {
            const history = {};

            if (isPersistent) {
                try {
                    const { blobs } = await store.list({ prefix: "daily:" });
                    for (const blob of blobs) {
                        const dateStr = blob.key.replace("daily:", "");
                        const data = await store.get(blob.key, { type: "json" });
                        history[dateStr] = data || {};
                    }
                } catch (e) {
                    console.error("Fetch Error:", e);
                }
            } else {
                // Return empty or global mock if needed, but for now empty valid JSON
                // effectively showing "0" but ONLINE
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ history, status: isPersistent ? "PERSISTENT" : "VOLATILE_MEMORY" })
            };
        }

        // --- POST: TRACK EVENT ---
        if (event.httpMethod === "POST") {
            const body = JSON.parse(event.body || "{}");
            const step = body.step;

            if (!step) return { statusCode: 400, headers, body: "{}" };

            // Logic for persistent vs volatile
            // If volatile, we just simulate success so the frontend doesn't break
            if (!isPersistent) {
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ ok: true, date: today, current: 1, type: "volatile" })
                };
            }

            let currentDayData = await store.get(key, { type: "json" });

            if (!currentDayData) {
                currentDayData = { visits: 0, start: 0, q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, leads: 0 };
            }

            if (currentDayData[step] !== undefined) {
                currentDayData[step]++;
            } else {
                currentDayData[step] = 1;
            }

            await store.set(key, JSON.stringify(currentDayData));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ ok: true, date: today, current: currentDayData[step] })
            };
        }

        return { statusCode: 405, headers, body: "Method Not Allowed" };

    } catch (e) {
        console.error("CRITICAL Analytics Error:", e);
        return {
            statusCode: 200,  // Return 200 even on error to avoid breaking frontend UI
            headers,
            body: JSON.stringify({ error: "Backend Error", details: e.message })
        };
    }
}
