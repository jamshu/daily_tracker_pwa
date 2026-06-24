// FIFA World Cup 2026 widget data layer. Fetches the tournament JSON once (via
// the /api/fifa proxy) and exposes pure helpers that derive the four views the
// dashboard card shows: upcoming fixtures, yesterday's results, group standings
// and top scorers. Standings and scorers don't exist in the source — they're
// folded from per-match data here.
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { base } from '$app/paths';
import { dateKey, shiftKey } from './store.js';

const FLAG_MAP = {
	'Algeria': 'dz', 'Argentina': 'ar', 'Australia': 'au', 'Austria': 'at',
	'Belgium': 'be', 'Bosnia & Herzegovina': 'ba', 'Brazil': 'br', 'Canada': 'ca',
	'Cape Verde': 'cv', 'Colombia': 'co', 'Croatia': 'hr', 'Curaçao': 'cw',
	'Czech Republic': 'cz', 'DR Congo': 'cd', 'Ecuador': 'ec', 'Egypt': 'eg',
	'England': 'gb-eng', 'France': 'fr', 'Germany': 'de', 'Ghana': 'gh',
	'Haiti': 'ht', 'Iran': 'ir', 'Iraq': 'iq', 'Ivory Coast': 'ci',
	'Japan': 'jp', 'Jordan': 'jo', 'Mexico': 'mx', 'Morocco': 'ma',
	'Netherlands': 'nl', 'New Zealand': 'nz', 'Norway': 'no', 'Panama': 'pa',
	'Paraguay': 'py', 'Portugal': 'pt', 'Qatar': 'qa', 'Saudi Arabia': 'sa',
	'Scotland': 'gb-sct', 'Senegal': 'sn', 'South Africa': 'za',
	'South Korea': 'kr', 'Spain': 'es', 'Sweden': 'se', 'Switzerland': 'ch',
	'Tunisia': 'tn', 'Turkey': 'tr', 'USA': 'us', 'Uruguay': 'uy',
	'Uzbekistan': 'uz'
};

function flagUrl(name) {
	const code = FLAG_MAP[name];
	return code ? `https://flagcdn.com/w40/${code}.png` : null;
}

/** { matches, loaded, error } */
export const fifa = writable({ matches: [], loaded: false, error: null });

let started = false;

export async function loadFifa() {
	if (!browser || started) return;
	started = true;
	try {
		const res = await fetch(`${base}/api/fifa`);
		const body = await res.json();
		if (!body.success) throw new Error(body.error || 'Could not load fixtures');
		fifa.set({ matches: body.matches || [], loaded: true, error: null });
	} catch (e) {
		started = false; // allow a retry on next mount
		fifa.set({ matches: [], loaded: true, error: e?.message || 'Could not load fixtures' });
	}
}

/* ----------------------------- helpers ----------------------------- */

// Knockout fixtures carry placeholder codes (e.g. "2A") until the bracket
// resolves. Treat anything without a space/lowercase letter and short as a code.
const PLACEHOLDER = /^(?:[12]?[A-L]|W\d+|RU\d+|\d+[A-L])$/;
export function teamLabel(name) {
	if (!name) return 'TBD';
	return PLACEHOLDER.test(name.trim()) ? 'TBD' : name;
}

function hasResult(m) {
	return Array.isArray(m?.score?.ft) && m.score.ft.length === 2;
}

// Parse source time string ("13:00 UTC-6") + source date ("YYYY-MM-DD") into
// a JS Date (UTC-based). Returns null if the string doesn't match.
function toLocalDatetime(date, timeStr) {
	if (!date || !timeStr) return null;
	const m = timeStr.match(/(\d{1,2}):(\d{2})\s*UTC([+-]\d+(?:\.\d+)?)?/i);
	if (!m) return null;
	const hh = Number(m[1]);
	const mm = Number(m[2]);
	const offsetHrs = Number(m[3] ?? 0);
	const [y, mo, d] = date.split('-').map(Number);
	// source local → UTC by subtracting the source offset
	const utcMs = Date.UTC(y, mo - 1, d, hh, mm) - offsetHrs * 3600000;
	return new Date(utcMs);
}

// Format a Date to "YYYY-MM-DD" in the browser's local timezone.
function localDateKey(dt) {
	const y = dt.getFullYear();
	const mo = String(dt.getMonth() + 1).padStart(2, '0');
	const d = String(dt.getDate()).padStart(2, '0');
	return `${y}-${mo}-${d}`;
}

// Sort key from date + time. Time looks like "13:00 UTC-6"; the leading HH:MM is
// enough to order same-day fixtures.
function sortKey(m) {
	const t = (m.time || '').slice(0, 5);
	return `${m.date || ''} ${t}`;
}

/** Next `n` fixtures from today onward that haven't been played yet. */
export function upcomingMatches(matches, n = 5) {
	const today = dateKey();
	return matches
		.filter((m) => m.date && m.date >= today && !hasResult(m))
		.sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
		.slice(0, n)
		.map((m) => ({
			date: m.date,
			...((() => {
			const dt = toLocalDatetime(m.date, m.time);
			return dt
				? { date: localDateKey(dt), time: dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }
				: { date: m.date, time: (m.time || '').slice(0, 5) };
		})()),
			team1: teamLabel(m.team1),
			team2: teamLabel(m.team2),
			flag1: flagUrl(teamLabel(m.team1)),
			flag2: flagUrl(teamLabel(m.team2)),
			group: m.group || m.round || '',
			ground: m.ground || ''
		}));
}

function scorerList(goals = []) {
	return goals
		.filter((g) => !g.owngoal)
		.map((g) => ({
			name: g.name,
			minute: g.minute,
			penalty: !!g.penalty
		}));
}

function ytUrl(team1, team2) {
	const q = encodeURIComponent(`${team1} vs ${team2} highlights`);
	return `https://www.youtube.com/results?search_query=${q}`;
}

/** Completed matches played on the given day (default: yesterday). */
export function dayResults(matches, day = shiftKey(dateKey(), -1)) {
	return matches
		.filter((m) => m.date === day && hasResult(m))
		.sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
		.map((m) => {
			const t1 = teamLabel(m.team1);
			const t2 = teamLabel(m.team2);
			return {
				team1: t1,
				team2: t2,
				flag1: flagUrl(t1),
				flag2: flagUrl(t2),
				ft: m.score.ft,
				scorers1: scorerList(m.goals1),
				scorers2: scorerList(m.goals2),
				ytUrl: ytUrl(t1, t2)
			};
		});
}

/** Group standings folded from completed group-stage matches. */
export function groupStandings(matches) {
	const groups = {};
	for (const m of matches) {
		if (!m.group || !hasResult(m)) continue;
		const [g1, g2] = m.score.ft;
		const g = (groups[m.group] ||= {});
		const row = (t) =>
			(g[t] ||= { team: t, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 });
		const a = row(m.team1);
		const b = row(m.team2);
		a.P++; b.P++;
		a.GF += g1; a.GA += g2;
		b.GF += g2; b.GA += g1;
		if (g1 > g2) { a.W++; a.Pts += 3; b.L++; }
		else if (g1 < g2) { b.W++; b.Pts += 3; a.L++; }
		else { a.D++; b.D++; a.Pts++; b.Pts++; }
	}
	const out = [];
	for (const name of Object.keys(groups).sort()) {
		const rows = Object.values(groups[name]).map((r) => ({ ...r, GD: r.GF - r.GA }));
		rows.sort((x, y) => y.Pts - x.Pts || y.GD - x.GD || y.GF - x.GF || x.team.localeCompare(y.team));
		out.push({ group: name, rows });
	}
	return out;
}

/** Top `n` scorers aggregated from all match goal events (own goals excluded). */
export function topScorers(matches, n = 10) {
	const tally = {};
	for (const m of matches) {
		for (const g of [...(m.goals1 || []), ...(m.goals2 || [])]) {
			if (g.owngoal || !g.name) continue;
			tally[g.name] = (tally[g.name] || 0) + 1;
		}
	}
	return Object.entries(tally)
		.map(([name, goals]) => ({ name, goals }))
		.sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
		.slice(0, n);
}
