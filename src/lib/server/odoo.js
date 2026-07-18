// Odoo JSON-RPC admin client (server-only).
//
// Uses the admin API key, so this module must NEVER be imported from client
// code — $env/dynamic/private makes that a build error, which is the point.
// Only the admin can write other partners' mail.push.device rows.
import { env } from '$env/dynamic/private';

const baseUrl = () => (env.ODOO_URL || '').replace(/\/+$/, '');

async function service(serviceName, method, args) {
	const url = `${baseUrl()}/jsonrpc`;
	const res = await fetch(url, {
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
	if (data.error) {
		const d = data.error.data || {};
		throw new Error(d.message || data.error.message || 'Odoo error');
	}
	return data.result;
}

let adminUid = null;
let _adminLoginPromise = null;

async function adminLogin() {
	if (adminUid) return adminUid;
	// Dedup: a cold start would otherwise fire N parallel logins.
	if (!_adminLoginPromise) {
		_adminLoginPromise = service('common', 'login', [env.ODOO_DB, env.ODOO_USERNAME, env.ODOO_API_KEY])
			.then((uid) => {
				if (!uid) throw new Error('Odoo admin auth failed — check ODOO_USERNAME / ODOO_API_KEY / ODOO_DB');
				adminUid = uid;
				return uid;
			})
			.finally(() => {
				_adminLoginPromise = null;
			});
	}
	return _adminLoginPromise;
}

export async function adminExecute(model, method, args = [], kwargs = {}) {
	const uid = await adminLogin();
	return service('object', 'execute_kw', [env.ODOO_DB, uid, env.ODOO_API_KEY, model, method, args, kwargs]);
}

export function odooConfigured() {
	return Boolean(env.ODOO_URL && env.ODOO_DB && env.ODOO_USERNAME && env.ODOO_API_KEY);
}

/**
 * OdooBot's partner id, cached.
 *
 * Scheduled reminders must be authored by the bot: Odoo never notifies a
 * message's own author, so a reminder authored by the recipient's own partner
 * would be silently dropped and no push would ever arrive.
 *
 * Odoo 19 removed xmlid_to_res_id — resolve via ir.model.data instead.
 */
let _botPartnerId = null;
export async function botPartnerId() {
	if (_botPartnerId) return _botPartnerId;
	const [row] = await adminExecute(
		'ir.model.data',
		'search_read',
		[[['module', '=', 'base'], ['name', '=', 'partner_root']]],
		{ fields: ['res_id'], limit: 1 }
	);
	if (!row?.res_id) throw new Error('Could not resolve OdooBot partner (base.partner_root)');
	_botPartnerId = row.res_id;
	return _botPartnerId;
}

/**
 * Find-or-create the res.partner representing one device.
 * `ref` holds the device UUID so repeat calls reuse the same partner.
 */
export async function findOrCreateDevicePartner({ deviceId, name }) {
	const ref = `dtl-device-${deviceId}`;
	const existing = await adminExecute('res.partner', 'search', [[['ref', '=', ref]]], { limit: 1 });
	const label = name?.trim() ? `${name.trim()} (Daily Tracker)` : `Daily Tracker device ${deviceId.slice(0, 8)}`;

	if (existing.length) {
		// Keep the display name in step with the name typed in the welcome modal.
		await adminExecute('res.partner', 'write', [existing, { name: label }]);
		return existing[0];
	}
	return adminExecute('res.partner', 'create', [{ name: label, ref, comment: 'Auto-created by Daily Tracker PWA for push reminders.' }]);
}
