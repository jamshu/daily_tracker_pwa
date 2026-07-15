import { json } from '@sveltejs/kit';
import {
	assertConfigured,
	sessionInfo,
	sessionCallKw,
	adminExecute,
	getModel
} from '$lib/server/odoo.js';
import { getSession, getContext, clearSessionCookie, refreshSessionCookie } from '$lib/server/session.js';

export const prerender = false;

const SETTINGS_FIELD = 'x_studio_settings';

async function resolveSession(cookies) {
	const sid = getSession(cookies);
	if (!sid) return null;
	const ctx = getContext(cookies);
	if (ctx?.uid && ctx?.allowed_company_ids?.[0]) {
		return { sid, uid: ctx.uid, companyId: ctx.allowed_company_ids[0] };
	}
	const { result: info, sessionId: newSid } = await sessionInfo(sid);
	if (newSid) refreshSessionCookie(cookies, newSid, sid);
	if (!info?.uid) return null;
	return { sid: newSid || sid, uid: info.uid, companyId: info.company_id ?? false };
}

// Export all user data in the format localdb.js expects.
// No bill images — JSON only.
export async function GET({ cookies }) {
	try {
		assertConfigured();
		const session = await resolveSession(cookies);
		if (!session) return json({ ok: false }, { status: 401 });

		let sid = session.sid;
		const call = async (model, method, args = [], kwargs = {}) => {
			const { result, sessionId } = await sessionCallKw(sid, model, method, args, kwargs);
			if (sessionId) { refreshSessionCookie(cookies, sessionId, sid); sid = sessionId; }
			return result ?? [];
		};

		const DAY_MODEL = getModel(); // x_dailytracker

		// All reads in parallel — safe since session rotation from any one doesn't
		// invalidate others (Odoo accepts the old id until it expires).
		const [dayRows, settingsRows, actRows, unitRows, budgetRows, expenseRows, tagRows, todoRows] =
			await Promise.all([
				call(DAY_MODEL, 'search_read', [[]], { fields: ['x_studio_date', 'x_studio_json', 'x_studio_notes'], limit: 5000 }),
				adminExecute('res.users', 'read', [[session.uid]], { fields: [SETTINGS_FIELD] }),
				call('x_activities', 'search_read', [[['x_studio_is_preset', '=', false]]], {
					fields: ['id', 'x_name', 'x_studio_icon', 'x_studio_category', 'x_studio_goal_id'],
					order: 'x_studio_sequence, x_name'
				}).catch(() => []),
				call('x_units', 'search_read',
					[['|', ['x_studio_user_id', '=', false], ['x_studio_user_id', '=', session.uid]]],
					{ fields: ['id', 'x_name'] }
				).catch(() => []),
				call('x_budget', 'search_read', [[]], { fields: ['x_name', 'x_studio_budget'] }).catch(() => []),
				call('x_expense', 'search_read', [[]], {
					fields: ['id', 'x_name', 'x_studio_date', 'x_studio_category', 'x_studio_amount', 'x_studio_tag_ids'],
					order: 'x_studio_date desc, id desc',
					limit: 10000
				}).catch(() => []),
				call('x_expense_tag', 'search_read', [[]], { fields: ['id', 'x_name'], order: 'x_name' }).catch(() => []),
				call('x_todo', 'search_read', [[]], {
					fields: ['id', 'x_name', 'x_studio_due_date', 'x_studio_done'],
					order: 'x_studio_done, x_studio_due_date asc'
				}).catch(() => []),
			]);

		// days: { 'YYYY-MM-DD': { data: json_string, notes: string } }
		const days = {};
		for (const r of dayRows) {
			if (r.x_studio_date) {
				days[r.x_studio_date] = {
					data: r.x_studio_json || '{}',
					notes: r.x_studio_notes || ''
				};
			}
		}

		// settings: strip cloud-only fields, add local-only defaults
		let rawSettings = {};
		try { rawSettings = JSON.parse(settingsRows?.[0]?.[SETTINGS_FIELD] || '{}'); } catch {}
		const settings = {
			activities: rawSettings.activities || {},
			theme: rawSettings.theme || 'default',
			sex: rawSettings.sex === 'female' ? 'female' : 'male',
			showNotes: rawSettings.showNotes === true,
			reminderTime: '21:00',
		};

		// Resolve goal ids → { value, unit, unitId }
		const goalIds = actRows
			.map(r => (Array.isArray(r.x_studio_goal_id) ? r.x_studio_goal_id[0] : r.x_studio_goal_id))
			.filter(Boolean);
		const goalMap = {};
		if (goalIds.length) {
			const goalRows = await call('x_goals', 'read', [goalIds], {
				fields: ['id', 'x_studio_value', 'x_studio_unit_id']
			}).catch(() => []);
			for (const g of goalRows) {
				goalMap[g.id] = {
					value: g.x_studio_value,
					unit: Array.isArray(g.x_studio_unit_id) ? g.x_studio_unit_id[1] : '',
					unitId: Array.isArray(g.x_studio_unit_id) ? g.x_studio_unit_id[0] : null,
				};
			}
		}

		const activities = actRows.map(r => {
			const gid = Array.isArray(r.x_studio_goal_id) ? r.x_studio_goal_id[0] : r.x_studio_goal_id;
			return {
				id: r.id,
				name: r.x_name,
				emoji: r.x_studio_icon || '',
				category: r.x_studio_category || 'Other',
				goal: gid ? (goalMap[gid] ?? null) : null,
			};
		});

		const units = unitRows.map(r => ({ id: r.id, name: r.x_name }));

		const budget = {};
		for (const r of budgetRows) {
			if (/^\d{4}-\d{2}$/.test(r.x_name)) {
				try { budget[r.x_name] = JSON.parse(r.x_studio_budget || '{}'); } catch { budget[r.x_name] = {}; }
			}
		}

		const expenses = expenseRows.map(r => ({
			id: r.id,
			x_name: r.x_name,
			x_studio_date: r.x_studio_date || '',
			x_studio_category: r.x_studio_category || '',
			x_studio_amount: r.x_studio_amount || 0,
			x_studio_tag_ids: Array.isArray(r.x_studio_tag_ids) ? r.x_studio_tag_ids : [],
		}));

		const tags = tagRows.map(r => ({ id: r.id, x_name: r.x_name }));

		const todos = todoRows.map(r => ({
			id: r.id,
			x_name: r.x_name,
			x_studio_due_date: r.x_studio_due_date || false,
			x_studio_done: r.x_studio_done === true,
		}));

		// seq: ensure localdb won't collide with any existing Odoo record id
		const allIds = [...actRows, ...unitRows, ...expenseRows, ...tagRows, ...todoRows].map(r => r.id).filter(Boolean);
		const seq = allIds.length ? Math.max(...allIds) + 1 : 1;

		const blob = { version: 1, seq, days, settings, activities, units, budget, expenses, tags, todos };

		return new Response(JSON.stringify(blob, null, 2), {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': 'attachment; filename="daily-tracker-export.json"'
			}
		});
	} catch (e) {
		const status = e?.status || 500;
		if (status >= 500) console.error('[export] GET failed:', e?.message, e?.data?.message || '');
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message }, { status });
	}
}
