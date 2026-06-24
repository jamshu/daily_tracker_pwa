// World news proxy. Fetches BBC World and Al Jazeera public RSS feeds in
// parallel (no key, no rate limit), merges them sorted newest-first, and
// returns { success, articles }. TTL 30 min. One feed failing won't kill the
// other — partial results are still returned.
import { json } from '@sveltejs/kit';

const FEEDS = [
	{ url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC' },
	{ url: 'https://www.aljazeera.com/xml/rss/all.xml',   source: 'AJ'  }
];
const TTL = 30 * 60 * 1000; // 30 minutes

let cache = { articles: null, ts: 0 };

export const prerender = false;

function parseRSS(xml, source) {
	const items = [];
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
		items.push({ title, description: stripHtml(description), link, pubDate, thumb, source });
	}
	return items;
}

function tag(block, name) {
	const m = block.match(new RegExp(`<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${name}>|<${name}[^>]*>([^<]*)<\\/${name}>`));
	return m ? (m[1] ?? m[2] ?? '').trim() : '';
}

function cdata(block, name) {
	const m = block.match(new RegExp(`<${name}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${name}>`));
	return m ? m[1].trim() : '';
}

function mediaThumb(block) {
	const m = block.match(/<media:thumbnail[^>]+url="([^"]+)"/);
	return m ? m[1] : null;
}

function stripHtml(s = '') {
	return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

function pubMs(pubDate) {
	if (!pubDate) return 0;
	const d = new Date(pubDate);
	return isNaN(d) ? 0 : d.getTime();
}

export async function GET() {
	const now = Date.now();
	if (cache.articles && now - cache.ts < TTL) {
		return json({ success: true, articles: cache.articles, cached: true });
	}

	const results = await Promise.allSettled(
		FEEDS.map(({ url, source }) =>
			fetch(url)
				.then((r) => { if (!r.ok) throw new Error(`${source} feed ${r.status}`); return r.text(); })
				.then((xml) => parseRSS(xml, source))
		)
	);

	const merged = [];
	for (const r of results) {
		if (r.status === 'fulfilled') merged.push(...r.value);
	}

	if (!merged.length) {
		if (cache.articles) {
			return json({ success: true, articles: cache.articles, cached: true, stale: true });
		}
		return json({ success: false, error: 'Could not load news feeds' }, { status: 502 });
	}

	// Sort newest first, dedupe by title
	const seen = new Set();
	const articles = merged
		.sort((a, b) => pubMs(b.pubDate) - pubMs(a.pubDate))
		.filter((a) => { if (seen.has(a.title)) return false; seen.add(a.title); return true; })
		.slice(0, 20);

	cache = { articles, ts: now };
	return json({ success: true, articles, cached: false });
}
