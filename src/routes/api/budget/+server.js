// Per-user household budget stored as JSON on the user's own res.users record,
// same pattern as /api/settings. Admin key used server-side; uid always taken
// from the authenticated session, never from the request body.
import { json } from '@sveltejs/kit';
import { assertConfigured, sessionInfo, adminExecute } from '$lib/server/odoo.js';
import { getSession, getContext, clearSessionCookie, refreshSessionCookie } from '$lib/server/session.js';

export const prerender = false;

const BUDGET_FIELD = 'x_studio_budget';
const MAX_CATEGORIES = 50;

async function uidFromSession(cookies) {
	const ctx = getContext(cookies);
	if (ctx?.uid) return ctx.uid;
	const sid = getSession(cookies);
	if (!sid) return null;
	const { result: info, sessionId } = await sessionInfo(sid);
	refreshSessionCookie(cookies, sessionId, sid);
	return info?.uid ?? null;
}

function parseBudget(raw) {
	try {
		const o = JSON.parse(raw || '{}');
		return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
	} catch {
		return {};
	}
}

function sanitizeMonth(month) {
	if (typeof month !== 'object' || !month || Array.isArray(month)) return {};
	const out = {};
	let count = 0;
	for (const [cat, val] of Object.entries(month)) {
		if (count >= MAX_CATEGORIES) break;
		if (typeof cat !== 'string' || !cat.trim()) continue;
		const budget = Math.max(0, Number(val?.budget) || 0);
		const actual = Math.max(0, Number(val?.actual) || 0);
		out[cat.trim()] = { budget, actual };
		count++;
	}
	return out;
}

function sanitizeData(body) {
	if (typeof body !== 'object' || !body || Array.isArray(body)) return {};
	const out = {};
	// Only accept YYYY-MM keys
	for (const [key, month] of Object.entries(body)) {
		if (!/^\d{4}-\d{2}$/.test(key)) continue;
		out[key] = sanitizeMonth(month);
	}
	return out;
}

export async function GET({ cookies }) {
	try {
		assertConfigured();
		if (!getSession(cookies)) return json({ ok: false }, { status: 401 });
		const uid = await uidFromSession(cookies);
		if (!uid) return json({ ok: false }, { status: 401 });

		const rows = await adminExecute('res.users', 'read', [[uid]], { fields: [BUDGET_FIELD] });
		return json({ ok: true, data: parseBudget(rows?.[0]?.[BUDGET_FIELD]) });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message || 'Could not load budget' }, { status });
	}
}

export async function POST({ request, cookies }) {
	try {
		assertConfigured();
		if (!getSession(cookies)) return json({ ok: false }, { status: 401 });
		const uid = await uidFromSession(cookies);
		if (!uid) return json({ ok: false }, { status: 401 });

		const body = await request.json();
		const data = sanitizeData(body?.data);

		await adminExecute('res.users', 'write', [[uid], { [BUDGET_FIELD]: JSON.stringify(data) }]);
		return json({ ok: true, data });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message || 'Could not save budget' }, { status });
	}
}
