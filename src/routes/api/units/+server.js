import { json } from '@sveltejs/kit';
import { assertConfigured, sessionInfo, sessionCallKw } from '$lib/server/odoo.js';
import { getSession, clearSessionCookie, refreshSessionCookie } from '$lib/server/session.js';

export const prerender = false;

// Unit catalog (x_units). Globals have no owner; users may add custom units.
//   x_name              → label ("Times", "Minutes", "Hours", "Verses", custom)
//   x_studio_user_id    → owner (false = global built-in)
//   x_studio_company_id → company (set on user-created units)
const UNIT_MODEL = 'x_units';

// ponytail: flip to false once the x_units model exists in Odoo. Until then the
// endpoint serves static mock units so the modal/goal UI is testable.
const STUB = false;
const STUB_UNITS = [
	{ id: 1, name: 'Times' },
	{ id: 2, name: 'Minutes' },
	{ id: 3, name: 'Hours' },
	{ id: 4, name: 'Verses' }
];

async function resolveSession(cookies) {
	const sid = getSession(cookies);
	if (!sid) return null;
	const { result: info, sessionId: newSid } = await sessionInfo(sid);
	if (newSid) refreshSessionCookie(cookies, newSid, sid);
	if (!info?.uid) return null;
	return { sid: newSid || sid, uid: info.uid, companyId: info.company_id ?? false };
}

export async function GET({ cookies }) {
	try {
		if (STUB) return json({ ok: true, units: STUB_UNITS });
		assertConfigured();
		const session = await resolveSession(cookies);
		if (!session) return json({ ok: false }, { status: 401 });

		const { result: rows, sessionId: newSid } = await sessionCallKw(
			session.sid,
			UNIT_MODEL,
			'search_read',
			[['|', ['x_studio_user_id', '=', false], ['x_studio_user_id', '=', session.uid]]],
			{ fields: ['id', 'x_name'], order: 'x_studio_user_id, x_name' }
		);
		if (newSid) refreshSessionCookie(cookies, newSid, session.sid);
		return json({ ok: true, units: (rows ?? []).map((r) => ({ id: r.id, name: r.x_name })) });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message }, { status });
	}
}

export async function POST({ request, cookies }) {
	try {
		const body = (await request.json()) ?? {};
		const name = String(body.name || '').trim().slice(0, 20);
		if (!name) return json({ ok: false, error: 'name required' }, { status: 400 });

		if (STUB) return json({ ok: true, unit: { id: Date.now(), name } });
		assertConfigured();
		const session = await resolveSession(cookies);
		if (!session) return json({ ok: false }, { status: 401 });
		let sid = session.sid;
		const call = async (...args) => {
			const { result, sessionId } = await sessionCallKw(sid, UNIT_MODEL, ...args);
			if (sessionId) { refreshSessionCookie(cookies, sessionId, sid); sid = sessionId; }
			return result;
		};

		// Dedupe: reuse an existing global/own unit with the same name (case-insensitive).
		const existing = await call('search_read', [
			['&', ['x_name', '=ilike', name], '|', ['x_studio_user_id', '=', false], ['x_studio_user_id', '=', session.uid]]
		], { fields: ['id', 'x_name'], limit: 1 });
		if (existing.length) {
			return json({ ok: true, unit: { id: existing[0].id, name: existing[0].x_name } });
		}

		const id = await call('create', [
			{ x_name: name, x_studio_user_id: session.uid, x_studio_company_id: session.companyId }
		]);
		return json({ ok: true, unit: { id, name } });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message }, { status });
	}
}
