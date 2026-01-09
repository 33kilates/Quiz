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
        const store = getAnalyticsStore();
        const today = new Date().toISOString().split('T')[0];
        const key = `daily:${today}`;

        // --- GET: RETURN HISTORY ---
        if (event.httpMethod === "GET") {
            // List all daily keys
            const { blobs } = await store.list({ prefix: "daily:" });
            const history = {};

            // Fetch all daily data (optimized: could limit to last 7 days)
            // For now, let's just fetch the simplified list or last 7 specifically if needed.
            // To keep it fast, we might just return the last 30 entries.
            for (const blob of blobs) {
                const dateStr = blob.key.replace("daily:", "");
                // Simple fetch for each (can be parallelized)
                const data = await store.get(blob.key, { type: "json" });
                history[dateStr] = data || {};
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ history })
            };
        }

        // --- POST: TRACK EVENT ---
        if (event.httpMethod === "POST") {
            const body = JSON.parse(event.body || "{}");
            const step = body.step;

            if (!step) return { statusCode: 400, headers, body: "{}" };

            // Optmistic Update or Read-Modify-Write
            // Native atomic increments aren't direct in Blobs without some logic, 
            // but for this traffic level, read-modify-write is okay with strong consistency.

            let currentDayData = await store.get(key, { type: "json" });

            if (!currentDayData) {
                currentDayData = { visits: 0, start: 0, q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, leads: 0 };
            }

            // Increment
            if (currentDayData[step] !== undefined) {
                currentDayData[step]++;
            } else {
                currentDayData[step] = 1;
            }

            // Save back
            await store.set(key, JSON.stringify(currentDayData));

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ ok: true, date: today, current: currentDayData[step] })
            };
        }

        return { statusCode: 405, headers, body: "Method Not Allowed" };

    } catch (e) {
        console.error("Analytics Error:", e);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Internal Server Error", details: e.message })
        };
    }
}
