// Server-only Odoo helpers. Two auth contexts:
//   1. ADMIN (execute_kw with the API key) — used ONLY to create a company +
//      user at signup. Requires ODOO_USERNAME to be an Odoo administrator.
//   2. USER SESSION (web session cookie) — every data call runs as the logged-in
//      user, so Odoo's multi-company record rules isolate each tenant's data.
import { env } from '$env/dynamic/private';

const baseUrl = () => (env.ODOO_URL || '').replace(/\/$/, '');
export const getModel = () => env.ODOO_MODEL;

export function assertConfigured() {
	if (!env.ODOO_URL || !env.ODOO_DB || !env.ODOO_USERNAME || !env.ODOO_API_KEY || !env.ODOO_MODEL) {
		throw new Error(
			'Odoo is not configured. Set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, ODOO_MODEL.'
		);
	}
}

/** Low-level JSON-RPC POST. Returns { result, setCookie[] }. */
async function rpc(path, params, cookie) {
	const headers = { 'Content-Type': 'application/json' };
	if (cookie) headers.cookie = cookie;
	const res = await fetch(`${baseUrl()}${path}`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params, id: Date.now() })
	});
	const setCookie =
		typeof res.headers.getSetCookie === 'function'
			? res.headers.getSetCookie()
			: res.headers.get('set-cookie')
				? [res.headers.get('set-cookie')]
				: [];
	const data = await res.json();
	if (data.error) {
		const err = data.error;
		const e = new Error(err.data?.message || err.message || 'Odoo error');
		// Odoo raises code 100 / SessionExpiredException when the session is dead.
		if (err.code === 100 || /SessionExpired|session expired/i.test(err.data?.name || err.message || '')) {
			e.status = 401;
		}
		throw e;
	}
	return { result: data.result, setCookie };
}

function parseSessionId(setCookieArr) {
	for (const c of setCookieArr || []) {
		const m = /^\s*session_id=([^;]+)/.exec(c);
		if (m) return m[1];
	}
	return null;
}

/* ------------------------------ admin context ----------------------------- */

let adminUid = null;

async function service(serviceName, method, args) {
	const res = await fetch(`${baseUrl()}/jsonrpc`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			method: 'call',
			params: { service: serviceName, method, args },
			id: Date.now()
		})
	});
	const data = await res.json();
	if (data.error) throw new Error(data.error.data?.message || data.error.message || 'Odoo error');
	return data.result;
}

async function adminLogin() {
	if (adminUid) return adminUid;
	adminUid = await service('common', 'login', [env.ODOO_DB, env.ODOO_USERNAME, env.ODOO_API_KEY]);
	if (!adminUid) throw new Error('Admin (API) authentication failed — check ODOO_USERNAME / ODOO_API_KEY');
	return adminUid;
}

export async function adminExecute(model, method, args = [], kwargs = {}) {
	const uid = await adminLogin();
	return service('object', 'execute_kw', [
		env.ODOO_DB,
		uid,
		env.ODOO_API_KEY,
		model,
		method,
		args,
		kwargs
	]);
}

/**
 * Create a tenant: a fresh company + a user assigned to it. Data isolation then
 * comes from Odoo's multi-company record rules on x_dailytracker.
 */
export async function createTenantUser({ name, email, password }) {
	const displayName = name || email;

	// 1) new company for this tenant
	const companyId = await adminExecute('res.company', 'create', [{ name: displayName }]);

	// 2) internal-user group (best-effort; ACLs still configured in Odoo)
	const vals = {
		name: displayName,
		login: email,
		email,
		password,
		company_id: companyId,
		company_ids: [[6, 0, [companyId]]]
	};
	try {
		const gid = await adminExecute('ir.model.data', 'xmlid_to_res_id', ['base.group_user', false]);
		if (gid) vals.groups_id = [[6, 0, [gid]]];
	} catch {
		/* fall back to Odoo default groups */
	}

	// 3) the user
	try {
		const userId = await adminExecute('res.users', 'create', [vals]);
		return { userId, companyId };
	} catch (e) {
		if (/login.*already|already.*registered|duplicate|unique|in use/i.test(e.message)) {
			const er = new Error('That email is already registered');
			er.status = 409;
			throw er;
		}
		throw e;
	}
}

/* ------------------------------ user session ------------------------------ */

/** Authenticate a user; returns { sessionId, info }. */
export async function authenticateUser(login, password) {
	const { result, setCookie } = await rpc('/web/session/authenticate', {
		db: env.ODOO_DB,
		login,
		password
	});
	if (!result || !result.uid) {
		const e = new Error('Invalid email or password');
		e.status = 401;
		throw e;
	}
	const sessionId = parseSessionId(setCookie);
	if (!sessionId) throw new Error('Odoo did not return a session');
	return { sessionId, info: result };
}

export async function sessionInfo(sessionId) {
	const { result } = await rpc('/web/session/get_session_info', {}, `session_id=${sessionId}`);
	if (!result || !result.uid) {
		const e = new Error('Session expired');
		e.status = 401;
		throw e;
	}
	return result;
}

/**
 * Build the Odoo call context from an authenticate / get_session_info result:
 * { lang, tz, uid } from user_context, plus allowed_company_ids scoped to the
 * user's current company so multi-company record rules filter to this tenant.
 * Shape: { lang, tz, uid, allowed_company_ids: [companyId] }.
 */
export function buildSessionContext(info) {
	const base = info?.user_context && typeof info.user_context === 'object' ? info.user_context : {};
	const ctx = { ...base };
	const current = info?.user_companies?.current_company ?? info?.company_id ?? null;
	if (current) ctx.allowed_company_ids = [current];
	if (info?.uid != null && ctx.uid == null) ctx.uid = info.uid;
	return ctx;
}

export async function sessionCallKw(sessionId, model, method, args = [], kwargs = {}) {
	const { result } = await rpc(
		'/web/dataset/call_kw',
		{ model, method, args, kwargs },
		`session_id=${sessionId}`
	);
	return result;
}

export async function destroySession(sessionId) {
	try {
		await rpc('/web/session/destroy', {}, `session_id=${sessionId}`);
	} catch {
		/* ignore — cookie is cleared regardless */
	}
}
