// Per-user settings stored as JSON on the user's own res.users record.
// Read/written with the admin key but ALWAYS scoped to the authenticated
// session's uid (never a client-supplied id), so a user can only touch their
// own settings. Odoo restricts a normal user from writing custom fields on
// their own res.users record (SELF_WRITEABLE_FIELDS), hence the admin path.
import { json } from '@sveltejs/kit';
import { assertConfigured, sessionInfo, adminExecute } from '$lib/server/odoo.js';
import { getSession, getContext, clearSessionCookie, refreshSessionCookie } from '$lib/server/session.js';
import { ACTIVITIES } from '$lib/config.js';
import { coerceTheme } from '$lib/themes.js';

export const prerender = false;

// Change this if you named the Studio field differently on res.users.
const SETTINGS_FIELD = 'x_studio_settings';
const ACTIVITY_IDS = ACTIVITIES.map((a) => a.id);
const MAX_CUSTOM = 20;

function sanitizeCustomActivities(arr) {
	if (!Array.isArray(arr)) return [];
	return arr.slice(0, MAX_CUSTOM).filter(
		(a) =>
			typeof a?.id === 'string' &&
			/^ca_[a-z0-9_]{1,30}$/.test(a.id) &&
			typeof a?.name === 'string' &&
			a.name.trim()
	).map((a) => ({
		id: a.id,
		name: String(a.name).trim().slice(0, 60),
		unit: String(a.unit ?? '').trim().slice(0, 20) || 'times',
		step: Math.max(1, Math.round(Number(a.step) || 1)),
		target: Math.max(1, Math.round(Number(a.target) || 1))
	}));
}

async function uidFromSession(cookies) {
	const ctx = getContext(cookies);
	if (ctx?.uid) return ctx.uid;
	const sid = getSession(cookies);
	if (!sid) return null;
	const { result: info, sessionId } = await sessionInfo(sid);
	refreshSessionCookie(cookies, sessionId, sid);
	return info?.uid ?? null;
}

function parseSettings(raw) {
	try {
		const o = JSON.parse(raw || '{}') || {};
		return o && typeof o === 'object' ? o : {};
	} catch {
		return {};
	}
}

function coerceSex(v) {
	return v === 'female' ? 'female' : 'male';
}

export async function GET({ cookies }) {
	try {
		assertConfigured();
		if (!getSession(cookies)) return json({ ok: false }, { status: 401 });
		const uid = await uidFromSession(cookies);
		if (!uid) return json({ ok: false }, { status: 401 });

		const rows = await adminExecute('res.users', 'read', [[uid]], { fields: [SETTINGS_FIELD] });
		return json({ ok: true, settings: parseSettings(rows?.[0]?.[SETTINGS_FIELD]) });
	} catch (e) {
		const status = e?.status || 500;
		if (status >= 500) console.error('[settings] GET failed:', e?.message, e?.data?.message || '');
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message || 'Could not load settings' }, { status });
	}
}

export async function POST({ request, cookies }) {
	try {
		assertConfigured();
		if (!getSession(cookies)) return json({ ok: false }, { status: 401 });
		const uid = await uidFromSession(cookies);
		if (!uid) return json({ ok: false }, { status: 401 });

		const body = await request.json();

		// sanitize: only known activity ids, positive integers
		const activities = {};
		for (const id of ACTIVITY_IDS) {
			const n = Number(body?.activities?.[id]);
			if (Number.isFinite(n) && n > 0) activities[id] = Math.round(n);
		}
		const theme = coerceTheme(body?.theme);
		const shareGlobal = body?.shareGlobal === true;
		// Sex: take a valid value from the body, else preserve what's already stored
		// (never wipe the value set at signup).
		const current = parseSettings(
			(await adminExecute('res.users', 'read', [[uid]], { fields: [SETTINGS_FIELD] }))?.[0]?.[
				SETTINGS_FIELD
			]
		);
		const sex = coerceSex(body?.sex ?? current.sex);
		const customActivities = sanitizeCustomActivities(body?.customActivities);
		// Spread `current` first so unknown keys (e.g. is_admin, push state) survive the save.
		const settings = { ...current, activities, theme, shareGlobal, sex, customActivities };

		await adminExecute('res.users', 'write', [[uid], { [SETTINGS_FIELD]: JSON.stringify(settings) }]);
		return json({ ok: true, settings });
	} catch (e) {
		const status = e?.status || 500;
		if (status === 401) clearSessionCookie(cookies);
		return json({ ok: false, error: e?.message || 'Could not save settings' }, { status });
	}
}
