// SvelteKit server-side JSON-RPC proxy to Odoo (OPTIONAL — not used in
// local-storage mode). This is the ONLY place Odoo credentials live. The
// browser calls this route with a small { action, data } envelope and never
// sees the URL/DB/key. Adapted from the svelte-odoo-pwa skill.
//
// NOTE: a pure static deploy can't run this route. To use Odoo, deploy to a
// host that runs SvelteKit's server (Vercel/Render/Node), or run this proxy
// elsewhere and point the client at it via PUBLIC_API_URL. See README.
import { json } from '@sveltejs/kit';
// Dynamic (not static) private env: the dev server still boots when .env is
// absent, and a missing var surfaces as a clear runtime error on first call
// instead of a build-time crash.
import { env } from '$env/dynamic/private';

const ODOO_URL = env.ODOO_URL;
const ODOO_DB = env.ODOO_DB;
const ODOO_USERNAME = env.ODOO_USERNAME;
const ODOO_API_KEY = env.ODOO_API_KEY;
const MODEL = env.ODOO_MODEL; // your Studio model technical name, e.g. x_dailytracker

function assertConfigured() {
	if (!ODOO_URL || !ODOO_DB || !ODOO_USERNAME || !ODOO_API_KEY || !MODEL) {
		throw new Error(
			'Odoo is not configured. Copy .env.example to .env and set ODOO_URL, ODOO_DB, ODOO_USERNAME, ODOO_API_KEY, ODOO_MODEL.'
		);
	}
}

/** @type {number|null} */
let cachedUid = null;

/** Low-level JSON-RPC call. */
async function callOdoo(service, method, args) {
	const response = await fetch(`${ODOO_URL}/jsonrpc`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			jsonrpc: '2.0',
			method: 'call',
			params: { service, method, args },
			id: Math.floor(Math.random() * 1000000)
		})
	});
	const data = await response.json();
	if (data.error) {
		throw new Error(data.error.data?.message || data.error.message || 'Odoo API Error');
	}
	return data.result;
}

/** Authenticate once, cache the uid. API key goes in the password position. */
async function authenticate() {
	if (cachedUid) return cachedUid;
	cachedUid = await callOdoo('common', 'login', [ODOO_DB, ODOO_USERNAME, ODOO_API_KEY]);
	if (!cachedUid) throw new Error('Authentication failed');
	return cachedUid;
}

/** Run an ORM method on a model. */
async function execute(model, method, args = [], kwargs = {}) {
	const uid = await authenticate();
	return callOdoo('object', 'execute_kw', [ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs]);
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
	try {
		assertConfigured();
		const { action, data } = await request.json();

		switch (action) {
			case 'create':
				return json({ success: true, id: await execute(MODEL, 'create', [data]) });

			case 'search': {
				const { domain = [], fields = [] } = data;
				return json({ success: true, results: await execute(MODEL, 'search_read', [domain], { fields }) });
			}

			case 'update': {
				const { id, values } = data;
				return json({ success: true, result: await execute(MODEL, 'write', [[id], values]) });
			}

			case 'delete': {
				const { id } = data;
				return json({ success: true, result: await execute(MODEL, 'unlink', [[id]]) });
			}

			default:
				return json({ success: false, error: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		console.error('Odoo API Error:', error);
		return json(
			{ success: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
}
