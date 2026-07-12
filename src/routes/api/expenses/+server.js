import { json } from '@sveltejs/kit';
import { assertConfigured, sessionInfo, sessionCallKw } from '$lib/server/odoo.js';
import { getSession, getContext, clearSessionCookie, refreshSessionCookie } from '$lib/server/session.js';
import { nextMonth } from '$lib/budgetCalc.js';

export const prerender = false;

// Expenses live in the Odoo `x_expense` model, scoped by a company record rule.
//   x_name                    → description
//   x_studio_date             → expense date ("YYYY-MM-DD")
//   x_studio_category         → budget category id (JSON key in x_budget, not a relation)
//   x_studio_amount           → amount
//   x_studio_bill             → optional bill image (base64 binary)
//   x_studio_bill_filename    → original filename
//   x_studio_company_id       → company (set on create)
//
// Every mutation recomputes the (category, month) total and denormalizes it
// into x_budget's JSON `actual`, so the budget/report pages need no changes.
const EXPENSE_MODEL = 'x_expense';
const BUDGET_MODEL = 'x_budget';
const TAG_MODEL = 'x_expense_tag'; // x_name + x_studio_company_id, linked via x_expense.x_studio_tag_ids
const MAX_PER_MONTH = 500;
const MAX_IMAGE_B64 = 1_400_000; // ~1 MB binary

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

function parseBudget(raw) {
	try {
		const o = JSON.parse(raw || '{}');
		return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
	} catch {
		return {};
	}
}

function monthRange(month) {
	return [`${month}-01`, `${nextMonth(month)}-01`];
}

export async function GET({ url, cookies }) {
	try {
		assertConfigured();
		const session = await resolveSession(cookies);
		if (!session) return json({ ok: false }, { status: 401 });

		const imageId = Number(url.searchParams.get('image'));
		if (imageId) {
			const { result: rows, sessionId: newSid } = await sessionCallKw(
				session.sid, EXPENSE_MODEL, 'read',
				[[imageId], ['x_studio_bill']]
			);
			if (newSid) refreshSessionCookie(cookies, newSid, session.sid);
			if (!rows?.length) return json({ ok: false, error: 'Not found' }, { status: 404 });
			return json({ ok: true, image: rows[0].x_studio_bill || null });
		}

		// Either month=YYYY-MM or an explicit from/to date range (inclusive).
		const month = url.searchParams.get('month') || '';
		const qFrom = url.searchParams.get('from') || '';
		const qTo = url.searchParams.get('to') || '';
		let domain;
		if (/^\d{4}-\d{2}-\d{2}$/.test(qFrom) && /^\d{4}-\d{2}-\d{2}$/.test(qTo)) {
			if (qTo < qFrom) return json({ ok: false, error: 'Range end before start' }, { status: 400 });
			if (new Date(qTo) - new Date(qFrom) > 366 * 86_400_000) {
				return json({ ok: false, error: 'Range too large (max 1 year)' }, { status: 400 });
			}
			domain = [['x_studio_date', '>=', qFrom], ['x_studio_date', '<=', qTo]];
		} else if (/^\d{4}-\d{2}$/.test(month)) {
			const [from, to] = monthRange(month);
			domain = [['x_studio_date', '>=', from], ['x_studio_date', '<', to]];
		} else {
			return json({ ok: false, error: 'month=YYYY-MM or from/to=YYYY-MM-DD required' }, { status: 400 });
		}

		let sid = session.sid;
		const call = async (model, ...args) => {
			const { result, sessionId } = await sessionCallKw(sid, model, ...args);
			if (sessionId) { refreshSessionCookie(cookies, sessionId, sid); sid = sessionId; }
			return result;
		};

		// Tag model may not exist yet (Odoo Studio setup pending) — degrade to no tags
		// rather than breaking the whole expense list.
		let tags = [];
		let hasTags = true;
		try {
			tags = (await call(TAG_MODEL, 'search_read', [[]], { fields: ['id', 'x_name'], order: 'x_name asc' })) ?? [];
		} catch {
			hasTags = false;
		}

		const fields = ['id', 'x_name', 'x_studio_date', 'x_studio_category', 'x_studio_amount', 'x_studio_bill_filename'];
		if (hasTags) fields.push('x_studio_tag_ids');
		const expenses = await call(EXPENSE_MODEL, 'search_read', [domain], {
			// Never fetch x_studio_bill in lists — a month of bills is megabytes.
			fields,
			order: 'x_studio_date desc, id desc',
			limit: 2000 // ponytail: range mode cap; raise if year-long ranges ever exceed it
		});

		return json({ ok: true, expenses: expenses ?? [], tags });
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

		// Run a session call on any model, keeping the rotated session id in sync.
		const call = async (model, ...args) => {
			const { result, sessionId } = await sessionCallKw(sid, model, ...args);
			if (sessionId) { refreshSessionCookie(cookies, sessionId, sid); sid = sessionId; }
			return result;
		};

		// Sum this company's expenses for (category, month) and write it into
		// x_budget's JSON actual for that month, preserving budget/label/emoji.
		const recompute = async (category, month) => {
			const [from, to] = monthRange(month);
			// read_group isn't RPC-callable on newer Odoo; sum client-side (≤500 rows/month).
			const amounts = await call(EXPENSE_MODEL, 'search_read',
				[[['x_studio_category', '=', category], ['x_studio_date', '>=', from], ['x_studio_date', '<', to]]],
				{ fields: ['x_studio_amount'] }
			);
			const sum = (amounts ?? []).reduce((s, r) => s + (r.x_studio_amount || 0), 0);
			const actual = Math.round(sum * 100) / 100;

			const existing = await call(BUDGET_MODEL, 'search_read',
				[[['x_name', '=', month]]],
				{ fields: ['id', 'x_studio_budget'], limit: 1 }
			);
			if (existing?.length) {
				const data = parseBudget(existing[0].x_studio_budget);
				data[category] = { ...data[category], actual };
				await call(BUDGET_MODEL, 'write', [[existing[0].id], { x_studio_budget: JSON.stringify(data) }]);
			} else {
				await call(BUDGET_MODEL, 'create', [{
					x_name: month,
					x_studio_company_id: companyId,
					x_studio_budget: JSON.stringify({ [category]: { budget: 0, actual } })
				}]);
			}
			return actual;
		};

		const sanitize = () => {
			const category = String(body.category || '').trim().slice(0, 50);
			if (!category) return { error: 'Category required' };
			const date = String(body.date || '').trim();
			if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Invalid date' };
			const amount = Math.round((Number(body.amount) || 0) * 100) / 100;
			if (amount <= 0) return { error: 'Amount must be positive' };
			const description = String(body.description || '').trim().slice(0, 120) || category;
			const vals = {
				x_name: description,
				x_studio_date: date,
				x_studio_category: category,
				x_studio_amount: amount
			};
			if ('image' in body) {
				const image = typeof body.image === 'string' ? body.image : '';
				if (image.length > MAX_IMAGE_B64) return { error: 'Image too large (max ~1 MB)' };
				vals.x_studio_bill = image || false;
				vals.x_studio_bill_filename = image ? String(body.filename || 'bill.jpg').slice(0, 80) : false;
			}
			// Omitting tagIds leaves existing tags untouched on update.
			if (Array.isArray(body.tagIds)) {
				const ids = body.tagIds.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 20);
				vals.x_studio_tag_ids = [[6, 0, ids]];
			}
			return { vals, category, month: date.slice(0, 7) };
		};

		if (body.action === 'addTag') {
			const name = String(body.name || '').trim().slice(0, 40);
			if (!name) return json({ ok: false, error: 'Tag name required' }, { status: 400 });
			const existing = await call(TAG_MODEL, 'search_read',
				[[['x_name', '=ilike', name]]], { fields: ['id', 'x_name'], limit: 1 });
			if (existing?.length) return json({ ok: true, tag: existing[0] });
			const id = await call(TAG_MODEL, 'create', [{ x_name: name, x_studio_company_id: companyId }]);
			return json({ ok: true, tag: { id, x_name: name } });
		}

		if (body.action === 'add') {
			const { error, vals, category, month } = sanitize();
			if (error) return json({ ok: false, error }, { status: 400 });

			const [from, to] = monthRange(month);
			const count = await call(EXPENSE_MODEL, 'search_count',
				[[['x_studio_date', '>=', from], ['x_studio_date', '<', to]]]);
			if (count >= MAX_PER_MONTH) {
				return json({ ok: false, error: `Maximum ${MAX_PER_MONTH} expenses per month` }, { status: 400 });
			}

			const id = await call(EXPENSE_MODEL, 'create', [{ ...vals, x_studio_company_id: companyId }]);
			const actual = await recompute(category, month);
			return json({ ok: true, id, actual, month, category });
		}

		if (body.action === 'update') {
			const id = Number(body.id);
			if (!id) return json({ ok: false, error: 'id required' }, { status: 400 });
			const { error, vals, category, month } = sanitize();
			if (error) return json({ ok: false, error }, { status: 400 });

			const rows = await call(EXPENSE_MODEL, 'search_read',
				[[['id', '=', id]]], { fields: ['x_studio_date', 'x_studio_category'] });
			if (!rows.length) return json({ ok: false, error: 'Not found' }, { status: 404 });
			const oldCat = rows[0].x_studio_category;
			const oldMonth = String(rows[0].x_studio_date || '').slice(0, 7);

			await call(EXPENSE_MODEL, 'write', [[id], vals]);
			const actual = await recompute(category, month);
			// Date or category moved — the old (cat, month) total shrank too.
			if (oldCat && (oldCat !== category || oldMonth !== month)) {
				await recompute(oldCat, oldMonth);
			}
			return json({ ok: true, id, actual, month, category });
		}

		if (body.action === 'delete') {
			const id = Number(body.id);
			if (!id) return json({ ok: false, error: 'id required' }, { status: 400 });
			const rows = await call(EXPENSE_MODEL, 'search_read',
				[[['id', '=', id]]], { fields: ['x_studio_date', 'x_studio_category'] });
			if (!rows.length) return json({ ok: false, error: 'Not found' }, { status: 404 });
			const category = rows[0].x_studio_category;
			const month = String(rows[0].x_studio_date || '').slice(0, 7);

			await call(EXPENSE_MODEL, 'unlink', [[id]]);
			const actual = category ? await recompute(category, month) : 0;
			return json({ ok: true, actual, month, category });
		}

		return json({ ok: false, error: 'Unknown action' }, { status: 400 });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message }, { status });
	}
}
