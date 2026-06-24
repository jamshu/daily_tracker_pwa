// World news proxy. Fetches BBC World News public RSS (no key, no rate limit)
// and parses it server-side. Returns { success, articles } to avoid CORS and
// centralise caching. TTL 30 min — RSS updates frequently, but no need to hit
// the feed on every page load.
import { json } from '@sveltejs/kit';

const FEED = 'https://feeds.bbci.co.uk/news/world/rss.xml';
const TTL = 30 * 60 * 1000; // 30 minutes

let cache = { articles: null, ts: 0 };

export const prerender = false;

function parseRSS(xml) {
	const items = [];
	// Extract each <item> block
	const itemRe = /<item>([\s\S]*?)<\/item>/g;
	let itemMatch;
	while ((itemMatch = itemRe.exec(xml)) !== null) {
		const block = itemMatch[1];
		const title = cdata(block, 'title');
		const description = cdata(block, 'description');
		const link = tag(block, 'link') || cdata(block, 'link');
		const pubDate = tag(block, 'pubDate');
		const thumb = mediaThumb(block);
		if (!title || !link) continue;
		items.push({ title, description: stripHtml(description), link, pubDate, thumb });
	}
	return items;
}

// Extract content between <tag>…</tag>, including CDATA.
function tag(block, name) {
	const m = block.match(new RegExp(`<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${name}>|<${name}[^>]*>([^<]*)<\\/${name}>`));
	return m ? (m[1] ?? m[2] ?? '').trim() : '';
}

function cdata(block, name) {
	const m = block.match(new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`));
	return m ? m[1].trim() : '';
}

// media:thumbnail url="…"
function mediaThumb(block) {
	const m = block.match(/<media:thumbnail[^>]+url="([^"]+)"/);
	return m ? m[1] : null;
}

function stripHtml(s = '') {
	return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

export async function GET() {
	const now = Date.now();
	if (cache.articles && now - cache.ts < TTL) {
		return json({ success: true, articles: cache.articles, cached: true });
	}

	try {
		const res = await fetch(FEED);
		if (!res.ok) throw new Error(`Feed returned ${res.status}`);
		const xml = await res.text();
		const articles = parseRSS(xml).slice(0, 15);
		cache = { articles, ts: now };
		return json({ success: true, articles, cached: false });
	} catch (error) {
		if (cache.articles) {
			return json({ success: true, articles: cache.articles, cached: true, stale: true });
		}
		return json(
			{ success: false, error: error instanceof Error ? error.message : 'Could not load news' },
			{ status: 502 }
		);
	}
}
