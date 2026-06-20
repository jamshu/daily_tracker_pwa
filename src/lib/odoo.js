// Browser-side Odoo client (OPTIONAL — not used in local-storage mode).
// Talks ONLY to your own /api/odoo proxy, never directly to Odoo.
// Adapted from the svelte-odoo-pwa skill. To switch the app from localStorage
// to Odoo, see README "Wiring to Odoo".
// @ts-check
import { base } from '$app/paths';
import { env } from '$env/dynamic/public';

// Optional: point a statically-hosted frontend at a proxy on another origin.
// Read via $env/dynamic/public (NOT import.meta.env): SvelteKit's Vite envPrefix
// is VITE_, so import.meta.env.PUBLIC_* is undefined. Empty => same-origin /api/odoo.
const PUBLIC_API_URL = env.PUBLIC_API_URL ? String(env.PUBLIC_API_URL) : '';

class OdooAPI {
	constructor() {
		this.apiUrl =
			PUBLIC_API_URL && PUBLIC_API_URL.trim() !== ''
				? `${PUBLIC_API_URL.replace(/\/$/, '')}/api/odoo`
				: `${base}/api/odoo`;
	}

	/** @param {string} action @param {any} data */
	async callApi(action, data) {
		const response = await fetch(this.apiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, data })
		});
		const result = await response.json();
		if (!result.success) throw new Error(result.error || 'API Error');
		return result;
	}

	/** @param {Record<string, any>} fields */
	async createRecord(fields) {
		return (await this.callApi('create', fields)).id;
	}

	/** @param {any[]} domain @param {string[]} fields */
	async searchRecords(domain = [], fields = []) {
		return (await this.callApi('search', { domain, fields })).results;
	}

	/** @param {number} id @param {Record<string, any>} values */
	async updateRecord(id, values) {
		return (await this.callApi('update', { id, values })).result;
	}

	/** @param {number} id */
	async deleteRecord(id) {
		return (await this.callApi('delete', { id })).result;
	}

	// --- Odoo relational field encoders (see the skill's odoo-backend.md) ---

	/** many2one expects an integer id (or false to clear). @param {number|string|null|undefined} id */
	formatMany2one(id) {
		return id ? Number(id) : false;
	}

	/** many2many replace-all command: [[6, 0, [ids]]]. @param {Array<number|string>} ids */
	formatMany2many(ids) {
		if (!Array.isArray(ids) || ids.length === 0) return [];
		return [[6, 0, ids.map((i) => Number(i))]];
	}
}

export const odooClient = new OdooAPI();
