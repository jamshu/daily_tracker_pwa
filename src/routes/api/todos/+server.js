import { json } from '@sveltejs/kit';
import { assertConfigured, sessionInfo, sessionCallKw } from '$lib/server/odoo.js';
import { getSession, getContext, clearSessionCookie, refreshSessionCookie } from '$lib/server/session.js';

export const prerender = false;

// Todos live in the Odoo `x_todo` model, scoped by a company record rule.
// All calls run as the logged-in user's session (not admin); Odoo enforces ACL.
//   x_name              → title
//   x_studio_due_date   → optional due date ("YYYY-MM-DD"), else false
//   x_studio_done       → boolean (false = open, true = done)
//   x_studio_company_id → company (set on create)
const TODO_MODEL = 'x_todo';
const MAX_OPEN = 50;

async function resolveSession(cookies) {
	const sid = getSession(cookies);
	if (!sid) return null;
	const ctx = getContext(cookies);
	if (ctx?.allowed_company_ids?.[0]) {
		return { sid, companyId: ctx.allowed_company_ids[0] };
	}
	const { result: info, sessionId: newSid } = await sessionInfo(sid);
	refreshSessionCookie(cookies, newSid, sid);
	if (!info?.uid) return null;
	return { sid: newSid || sid, companyId: info.company_id ?? false };
}

export async function GET({ cookies }) {
	try {
		assertConfigured();
		const session = await resolveSession(cookies);
		if (!session) return json({ ok: false }, { status: 401 });

		const { result: todos, sessionId: newSid } = await sessionCallKw(
			session.sid, TODO_MODEL, 'search_read',
			[[]],
			{
				fields: ['id', 'x_name', 'x_studio_due_date', 'x_studio_done'],
				order: 'x_studio_done, x_studio_due_date asc'
			}
		);
		if (newSid) refreshSessionCookie(cookies, newSid, session.sid);

		return json({ ok: true, todos: todos ?? [] });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message }, { status });
	}
}

export async function POST({ request, cookies }) {
	try {
		assertConfigured();
		const session = await resolveSession(cookies);
		if (!session) return json({ ok: false }, { status: 401 });

		const body = (await request.json()) ?? {};
		const { companyId } = session;
		let sid = session.sid;

		// Run a session call and keep the (possibly rotated) session id in sync.
		const call = async (...args) => {
			const { result, sessionId } = await sessionCallKw(sid, TODO_MODEL, ...args);
			if (sessionId) { refreshSessionCookie(cookies, sessionId, sid); sid = sessionId; }
			return result;
		};

		if (body.action === 'add') {
			const title = String(body.title || '').trim().slice(0, 60);
			if (!title) return json({ ok: false, error: 'Title required' }, { status: 400 });

			// Optional due date — a plain "YYYY-MM-DD" (Date field), else false.
			let due = false;
			const date = String(body.date || '').trim();
			if (date) {
				if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
					return json({ ok: false, error: 'Invalid date' }, { status: 400 });
				}
				due = date;
			}

			const count = await call('search_count', [[['x_studio_done', '=', false]]]);
			if (count >= MAX_OPEN) {
				return json({ ok: false, error: `Maximum ${MAX_OPEN} open todos` }, { status: 400 });
			}

			const id = await call('create', [
				{
					x_name: title,
					x_studio_due_date: due,
					x_studio_done: false,
					x_studio_company_id: companyId
				}
			]);
			return json({ ok: true, id });
		}

		if (body.action === 'toggle') {
			const id = Number(body.id);
			if (!id) return json({ ok: false, error: 'id required' }, { status: 400 });
			const rows = await call('search_read', [[['id', '=', id]]], { fields: ['x_studio_done'] });
			if (!rows.length) return json({ ok: false, error: 'Not found' }, { status: 404 });
			const next = !rows[0].x_studio_done;
			await call('write', [[id], { x_studio_done: next }]);
			return json({ ok: true, done: next });
		}

		if (body.action === 'delete') {
			const id = Number(body.id);
			if (!id) return json({ ok: false, error: 'id required' }, { status: 400 });
			const rows = await call('search', [[['id', '=', id]]]);
			if (!rows.length) return json({ ok: false, error: 'Not found' }, { status: 404 });
			await call('unlink', [[id]]);
			return json({ ok: true });
		}

		return json({ ok: false, error: 'Unknown action' }, { status: 400 });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message }, { status });
	}
}
