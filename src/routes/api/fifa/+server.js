// FIFA World Cup 2026 data proxy. Fetches the public-domain openfootball JSON
// (no key, no rate limit) and serves it to the browser through our own route so
// we dodge CORS and centralise caching. The data is the whole tournament in one
// document, so we cache it in-memory per warm instance and only refetch when the
// TTL lapses. Returns { success, matches } (mirrors /api/odoo's response shape).
import { json } from '@sveltejs/kit';

const SOURCE = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
const TTL = 60 * 60 * 1000; // 1 hour

// Module-level cache: survives across requests on a warm serverless instance.
let cache = { matches: null, ts: 0 };

export const prerender = false;

export async function GET() {
	const now = Date.now();
	if (cache.matches && now - cache.ts < TTL) {
		return json({ success: true, matches: cache.matches, cached: true });
	}

	try {
		const res = await fetch(SOURCE);
		if (!res.ok) throw new Error(`Source returned ${res.status}`);
		const doc = await res.json();
		const matches = Array.isArray(doc?.matches) ? doc.matches : [];
		cache = { matches, ts: now };
		return json({ success: true, matches, cached: false });
	} catch (error) {
		// Serve last good data if we have any, even when a refetch fails.
		if (cache.matches) {
			return json({ success: true, matches: cache.matches, cached: true, stale: true });
		}
		return json(
			{ success: false, error: error instanceof Error ? error.message : 'Could not load fixtures' },
			{ status: 502 }
		);
	}
}
