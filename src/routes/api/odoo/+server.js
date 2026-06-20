// Data proxy. Every call runs as the LOGGED-IN user via their Odoo web session
// (not the admin key), so Odoo's multi-company record rules isolate each
// tenant's x_dailytracker records. Returns 401 when there is no valid session.
import { json } from '@sveltejs/kit';
import { assertConfigured, sessionCallKw, sessionInfo, getModel } from '$lib/server/odoo.js';
import { getSession, clearSessionCookie } from '$lib/server/session.js';

// Must run as a serverless function, never prerendered (it's a POST proxy).
export const prerender = false;

export async function POST({ request, cookies }) {
	try {
		assertConfigured();

		const sid = getSession(cookies);
		if (!sid) return json({ success: false, error: 'Not authenticated' }, { status: 401 });

		const { action, data } = await request.json();
		const MODEL = getModel();

		switch (action) {
			case 'create':
				return json({ success: true, id: await sessionCallKw(sid, MODEL, 'create', [data]) });

			case 'search': {
				const { domain = [], fields = [] } = data;
				// Hard-scope every search to the logged-in user's own tenant, server-
				// side, so a loose/misconfigured Odoo record rule can never leak
				// another company's rows into the app. Prefer the company filter;
				// fall back to create_uid if the session has no company.
				const info = await sessionInfo(sid);
				const companyId = info?.user_companies?.current_company ?? info?.company_id ?? null;
				const scope = companyId
					? ['x_studio_company_id', '=', companyId]
					: ['create_uid', '=', info.uid];
				const scopedDomain = [scope, ...domain];
				return json({
					success: true,
					results: await sessionCallKw(sid, MODEL, 'search_read', [scopedDomain], { fields })
				});
			}

			case 'update': {
				const { id, values } = data;
				return json({
					success: true,
					result: await sessionCallKw(sid, MODEL, 'write', [[id], values])
				});
			}

			case 'delete': {
				const { id } = data;
				return json({ success: true, result: await sessionCallKw(sid, MODEL, 'unlink', [[id]]) });
			}

			default:
				return json({ success: false, error: 'Invalid action' }, { status: 400 });
		}
	} catch (error) {
		const status = error?.status || 500;
		if (status === 401) clearSessionCookie(cookies); // expired session -> force re-login
		console.error('Odoo API Error:', error);
		return json(
			{ success: false, error: error instanceof Error ? error.message : 'Unknown error' },
			{ status }
		);
	}
}
