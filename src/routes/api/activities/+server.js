import { json } from '@sveltejs/kit';
import { assertConfigured, sessionInfo, sessionCallKw } from '$lib/server/odoo.js';
import { getSession, clearSessionCookie, refreshSessionCookie } from '$lib/server/session.js';

export const prerender = false;

// Custom activity definitions (x_activities), with optional goal (x_goals →
// x_units). Per-day logged values live in the day record, not here.
//   x_name              → activity name
//   x_studio_is_preset  → true = global catalog row, false = user's activity
//   x_studio_category   → preset grouping label (presets only)
//   x_studio_user_id    → owner (false for presets)
//   x_studio_goal_id    → optional many2one x_goals (empty = boolean isDone)
//   x_studio_icon       → optional emoji shown next to the name (char, size 16)
//   x_studio_source_id  → optional link to the preset it was created from
//   x_studio_company_id → company
// x_goals: x_studio_value (int), x_studio_unit_id (many2one x_units)
const ACT_MODEL = 'x_activities';
const GOAL_MODEL = 'x_goals';

// ponytail: flip to false once x_activities/x_goals/x_units exist in Odoo. Until
// then GET serves static mocks and POST echoes success so the flow is testable.
const STUB = false;
const STUB_PRESETS = [
	{ id: 101, name: 'Sunnan Al-Rawatib', emoji: '🕌', category: 'Prayers', goal: null },
	{ id: 102, name: 'Duha', emoji: '🌞', category: 'Prayers', goal: null },
	{ id: 103, name: 'Taraweeh', emoji: '', category: 'Prayers', goal: null },
	{ id: 201, name: 'Mondays & Thursdays', emoji: '🌙', category: 'Fasting', goal: null },
	{ id: 202, name: 'White days fasting', emoji: '', category: 'Fasting', goal: null },
	{ id: 301, name: 'Listen Quran', emoji: '🎧', category: 'Learning & dawah', goal: { value: 10, unit: 'Minutes' } },
	{ id: 302, name: 'Memorize Quran', emoji: '', category: 'Learning & dawah', goal: { value: 5, unit: 'Verses' } }
];
const STUB_ACTIVITIES = [
	{ id: 501, name: 'Read Hadith', emoji: '📜', goal: { value: 3, unit: 'Times' } },
	{ id: 502, name: 'Smile (sadaqah)', emoji: '', goal: null }
];

async function resolveSession(cookies) {
	const sid = getSession(cookies);
	if (!sid) return null;
	const { result: info, sessionId: newSid } = await sessionInfo(sid);
	if (newSid) refreshSessionCookie(cookies, newSid, sid);
	if (!info?.uid) return null;
	return { sid: newSid || sid, uid: info.uid, companyId: info.company_id ?? false };
}

// Resolve goal ids → { [goalId]: { value, unit } } via x_goals (unit name comes
// back on the many2one display value).
async function resolveGoals(call, goalIds) {
	// search_read returns many2one as [id, name] — extract the numeric id.
	const ids = [...new Set(goalIds.map((g) => (Array.isArray(g) ? g[0] : g)).filter(Boolean))];
	if (!ids.length) return {};
	const rows = await call(GOAL_MODEL, 'read', [ids], {
		fields: ['id', 'x_studio_value', 'x_studio_unit_id']
	});
	const map = {};
	for (const r of rows) {
		const unit = Array.isArray(r.x_studio_unit_id) ? r.x_studio_unit_id[1] : '';
		map[r.id] = { value: r.x_studio_value, unit };
	}
	return map;
}

const goalOf = (row, goalMap) => {
	const gid = Array.isArray(row.x_studio_goal_id) ? row.x_studio_goal_id[0] : row.x_studio_goal_id;
	return gid ? goalMap[gid] ?? null : null;
};

export async function GET({ cookies }) {
	try {
		if (STUB) return json({ ok: true, activities: STUB_ACTIVITIES, presets: STUB_PRESETS });
		assertConfigured();
		const session = await resolveSession(cookies);
		if (!session) return json({ ok: false }, { status: 401 });
		let sid = session.sid;
		const call = async (model, ...args) => {
			const { result, sessionId } = await sessionCallKw(sid, model, ...args);
			if (sessionId) { refreshSessionCookie(cookies, sessionId, sid); sid = sessionId; }
			return result;
		};

		const baseFields = ['id', 'x_name', 'x_studio_category', 'x_studio_goal_id'];
		const fetchRows = async (fields) => {
			const presetRows = await call(ACT_MODEL, 'search_read', [[['x_studio_is_preset', '=', true]]], {
				fields, order: 'x_studio_category, x_studio_sequence, x_name'
			});
			const userRows = await call(
				ACT_MODEL, 'search_read',
				[[['x_studio_is_preset', '=', false], ['x_studio_user_id', '=', session.uid]]],
				{ fields, order: 'x_studio_sequence, x_name' }
			);
			return { presetRows, userRows };
		};
		let rows;
		try {
			rows = await fetchRows([...baseFields, 'x_studio_icon']);
		} catch (fe) {
			// x_studio_icon is a Studio field created by hand — if it doesn't exist
			// yet, retry without it so the list still loads.
			console.error('[activities] icon field read failed, retrying without:', fe?.message);
			rows = await fetchRows(baseFields);
		}
		const { presetRows, userRows } = rows;
		// Goal join is best-effort: if reading x_goals/x_units fails (e.g. ACL),
		// still return the activities (goal-based ones degrade to a toggle) instead
		// of failing the whole list. Log the real cause.
		let goalMap = {};
		try {
			goalMap = await resolveGoals(
				call,
				[...presetRows, ...userRows].map((r) => r.x_studio_goal_id)
			);
		} catch (ge) {
			console.error('[activities] goal join failed:', ge?.message);
		}

		return json({
			ok: true,
			activities: userRows.map((r) => ({
				id: r.id, name: r.x_name, emoji: r.x_studio_icon || '',
				category: r.x_studio_category || 'Other', goal: goalOf(r, goalMap)
			})),
			presets: presetRows.map((r) => ({
				id: r.id, name: r.x_name, emoji: r.x_studio_icon || '',
				category: r.x_studio_category || 'Other', goal: goalOf(r, goalMap)
			}))
		});
	} catch (e) {
		const status = e?.status || 500;
		if (status >= 500) console.error('[activities] GET failed:', e?.message, e?.data?.message || '');
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message }, { status });
	}
}

export async function POST({ request, cookies }) {
	try {
		const body = (await request.json()) ?? {};

		if (STUB) {
			if (body.action === 'delete') return json({ ok: true });
			return json({ ok: true, id: Date.now() });
		}
		assertConfigured();
		const session = await resolveSession(cookies);
		if (!session) return json({ ok: false }, { status: 401 });
		let sid = session.sid;
		const call = async (model, ...args) => {
			const { result, sessionId } = await sessionCallKw(sid, model, ...args);
			if (sessionId) { refreshSessionCookie(cookies, sessionId, sid); sid = sessionId; }
			return result;
		};
		const owner = { x_studio_user_id: session.uid, x_studio_company_id: session.companyId };

		if (body.action === 'add-from-preset') {
			const presetId = Number(body.presetId);
			if (!presetId) return json({ ok: false, error: 'presetId required' }, { status: 400 });
			const presetFields = ['x_name', 'x_studio_goal_id', 'x_studio_category'];
			let p;
			try {
				[p] = await call(ACT_MODEL, 'read', [[presetId]], {
					fields: [...presetFields, 'x_studio_icon']
				});
			} catch {
				// x_studio_icon may not exist yet — retry without it.
				[p] = await call(ACT_MODEL, 'read', [[presetId]], { fields: presetFields });
			}
			if (!p) return json({ ok: false, error: 'Preset not found' }, { status: 404 });
			const goalId = Array.isArray(p.x_studio_goal_id) ? p.x_studio_goal_id[0] : p.x_studio_goal_id;
			const id = await call(ACT_MODEL, 'create', [{
				x_name: p.x_name, x_studio_is_preset: false, x_studio_source_id: presetId,
				x_studio_category: p.x_studio_category || false,
				...(p.x_studio_icon ? { x_studio_icon: p.x_studio_icon } : {}),
				x_studio_goal_id: goalId || false, ...owner
			}]);
			return json({ ok: true, id });
		}

		if (body.action === 'add-custom') {
			const name = String(body.name || '').trim().slice(0, 60);
			if (!name) return json({ ok: false, error: 'name required' }, { status: 400 });
			const emoji = String(body.emoji || '').trim().slice(0, 16);
			let goalId = false;
			if (body.goal && Number(body.goal.value) > 0 && Number(body.goal.unitId)) {
				goalId = await call(GOAL_MODEL, 'create', [{
					x_name: `${Math.round(body.goal.value)}`,
					x_studio_value: Math.round(body.goal.value),
					x_studio_unit_id: Number(body.goal.unitId), ...owner
				}]);
			}
			const id = await call(ACT_MODEL, 'create', [{
				x_name: name, x_studio_is_preset: false, x_studio_goal_id: goalId,
				...(emoji ? { x_studio_icon: emoji } : {}), ...owner
			}]);
			return json({ ok: true, id });
		}

		if (body.action === 'delete') {
			const id = Number(body.id);
			if (!id) return json({ ok: false, error: 'id required' }, { status: 400 });
			await call(ACT_MODEL, 'unlink', [[id]]);
			return json({ ok: true });
		}

		return json({ ok: false, error: 'Unknown action' }, { status: 400 });
	} catch (e) {
		const status = e?.status || 500;
		if (status >= 500) console.error('[activities] POST failed:', e?.message, e?.data?.message || '');
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message }, { status });
	}
}
