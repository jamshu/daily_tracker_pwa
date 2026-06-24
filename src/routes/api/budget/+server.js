import { json } from '@sveltejs/kit';
import { assertConfigured, sessionInfo, sessionCallKw } from '$lib/server/odoo.js';
import { getSession, getContext, clearSessionCookie, refreshSessionCookie } from '$lib/server/session.js';

export const prerender = false;

const BUDGET_MODEL = 'x_budget';
const MAX_CATEGORIES = 50;

async function getSessionData(cookies) {
	const sid = getSession(cookies);
	if (!sid) return null;
	const ctx = getContext(cookies);
	if (ctx?.allowed_company_ids?.[0]) {
		return { sid, companyId: ctx.allowed_company_ids[0] };
	}
	const { result: info, sessionId: newSid } = await sessionInfo(sid);
	refreshSessionCookie(cookies, newSid, sid);
	return { sid: newSid || sid, companyId: info?.company_id ?? false };
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
	for (const [key, month] of Object.entries(body)) {
		if (!/^\d{4}-\d{2}$/.test(key)) continue;
		out[key] = sanitizeMonth(month);
	}
	return out;
}

export async function GET({ cookies }) {
	try {
		assertConfigured();
		const session = await getSessionData(cookies);
		if (!session) return json({ ok: false }, { status: 401 });

		const { result: rows, sessionId: newSid } = await sessionCallKw(
			session.sid, BUDGET_MODEL, 'search_read',
			[[]],
			{ fields: ['x_name', 'x_studio_budget'] }
		);
		if (newSid) refreshSessionCookie(cookies, newSid, session.sid);

		const data = {};
		for (const r of rows ?? []) {
			if (/^\d{4}-\d{2}$/.test(r.x_name)) {
				data[r.x_name] = parseBudget(r.x_studio_budget);
			}
		}
		return json({ ok: true, data });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message || 'Could not load budget' }, { status });
	}
}

export async function POST({ request, cookies }) {
	try {
		assertConfigured();
		const session = await getSessionData(cookies);
		if (!session) return json({ ok: false }, { status: 401 });

		const body = await request.json();
		const data = sanitizeData(body?.data);
		let sid = session.sid;

		for (const [key, monthData] of Object.entries(data)) {
			const { result: existing, sessionId: s1 } = await sessionCallKw(
				sid, BUDGET_MODEL, 'search_read',
				[[['x_name', '=', key]]],
				{ fields: ['id'], limit: 1 }
			);
			if (s1) { refreshSessionCookie(cookies, s1, sid); sid = s1; }

			if (existing?.length) {
				const { sessionId: s2 } = await sessionCallKw(
					sid, BUDGET_MODEL, 'write',
					[[existing[0].id], { x_studio_budget: JSON.stringify(monthData) }]
				);
				if (s2) { refreshSessionCookie(cookies, s2, sid); sid = s2; }
			} else {
				const { sessionId: s2 } = await sessionCallKw(
					sid, BUDGET_MODEL, 'create',
					[{
						x_name: key,
						x_studio_company_id: session.companyId,
						x_studio_budget: JSON.stringify(monthData)
					}]
				);
				if (s2) { refreshSessionCookie(cookies, s2, sid); sid = s2; }
			}
		}
		return json({ ok: true, data });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message || 'Could not save budget' }, { status });
	}
}
