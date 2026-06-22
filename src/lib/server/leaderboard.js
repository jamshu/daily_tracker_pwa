// Server-only leaderboard helpers. All cross-user aggregation runs through the
// admin key (adminExecute) because each user's daily records are isolated by Odoo
// record rules — a user session can never read another user's rows. Callers are
// responsible for authorization (only expose scores the requester may see).
import { adminExecute, getModel } from './odoo.js';
import { dayPoints } from '$lib/config.js';

// Custom Odoo models (created once in Studio).
export const GROUP_MODEL = 'x_lb_group';
export const MEMBER_MODEL = 'x_lb_member';
export const SETTINGS_FIELD = 'x_studio_settings';

const WINDOW_DAYS = 30;

function windowStart() {
	const d = new Date();
	d.setDate(d.getDate() - (WINDOW_DAYS - 1));
	return d.toISOString().slice(0, 10);
}

/** m2o fields read back as [id, display_name] — pull the id (or a plain int). */
export function m2oId(v) {
	return Array.isArray(v) ? v[0] : v || null;
}
export function m2oName(v) {
	return Array.isArray(v) ? v[1] : '';
}

/**
 * Sum rolling-30-day points per user. `uids` optionally restricts the scan.
 * Returns Map<uid, points>. Scored against DEFAULT targets via dayPoints().
 */
export async function scoreByUser(uids) {
	const domain = [['x_studio_date', '>=', windowStart()]];
	if (Array.isArray(uids) && uids.length) domain.push(['create_uid', 'in', uids]);
	const rows = await adminExecute(getModel(), 'search_read', [domain], {
		fields: ['create_uid', 'x_studio_json']
	});
	const map = new Map();
	for (const r of rows) {
		const owner = m2oId(r.create_uid);
		if (!owner) continue;
		map.set(owner, (map.get(owner) || 0) + dayPoints(r.x_studio_json));
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
