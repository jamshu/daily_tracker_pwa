// Server-only leaderboard helpers. All cross-user aggregation runs through the
// admin key (adminExecute) because each user's daily records are isolated by Odoo
// record rules — a user session can never read another user's rows. Callers are
// responsible for authorization (only expose scores the requester may see).
import { adminExecute, getModel } from './odoo.js';
import { dayProgress, parseDay } from '$lib/config.js';

// Custom Odoo models (created once in Studio).
export const GROUP_MODEL = 'x_lb_group';
export const MEMBER_MODEL = 'x_lb_member';
export const SETTINGS_FIELD = 'x_studio_settings';

function today() {
	const d = new Date();
	const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
	return local.toISOString().slice(0, 10);
}

/** m2o fields read back as [id, display_name] — pull the id (or a plain int). */
export function m2oId(v) {
	return Array.isArray(v) ? v[0] : v || null;
}
export function m2oName(v) {
	return Array.isArray(v) ? v[1] : '';
}

/**
 * Today's score (0–100) per user — the SAME 0–100 scale shown on the dashboard
 * ring, for the current day only. Scored against DEFAULT targets (anti-gaming).
 * `uids` optionally restricts the scan. Returns Map<uid, score 0–100>.
 */
export async function scoreByUser(uids) {
	const domain = [['x_studio_date', '=', today()]];
	if (Array.isArray(uids) && uids.length) domain.push(['create_uid', 'in', uids]);
	const rows = await adminExecute(getModel(), 'search_read', [domain], {
		fields: ['create_uid', 'x_studio_json']
	});
	// Scoring of "prayed at home" depends on each user's sex, stored in their
	// res.users settings JSON — load it for the distinct owners in this batch.
	const owners = [...new Set(rows.map((r) => m2oId(r.create_uid)).filter(Boolean))];
	const sexByUid = new Map();
	if (owners.length) {
		const userRows = await adminExecute('res.users', 'read', [owners], {
			fields: ['id', SETTINGS_FIELD]
		});
		for (const u of userRows) {
			let sex = 'male';
			try {
				sex = JSON.parse(u[SETTINGS_FIELD] || '{}')?.sex === 'female' ? 'female' : 'male';
			} catch {
				/* default male */
			}
			sexByUid.set(u.id, sex);
		}
	}
	const map = new Map();
	for (const r of rows) {
		const owner = m2oId(r.create_uid);
		if (!owner) continue;
		map.set(owner, dayProgress(parseDay(r.x_studio_json), null, sexByUid.get(owner)) * 100);
	}
	return map;
}

/** Build ranked rows from [{id,name}] users + a score map. */
export function rankRows(users, scoreMap, myUid) {
	const rows = users.map((u) => ({
		name: u.name,
		score: Math.round(scoreMap.get(u.id) || 0),
		isMe: u.id === myUid
	}));
	rows.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
	rows.forEach((r, i) => (r.rank = i + 1));
	return rows;
}
