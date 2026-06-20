// Data proxy. Every call runs as the LOGGED-IN user via their Odoo web session
// (not the admin key). We pass the user's own context captured at login
// ({ lang, tz, uid, allowed_company_ids }) so Odoo's multi-company record rules
// resolve correctly, AND hard-scope the search to the user's tenant as belt-and-
// suspenders. Returns 401 when there is no session.
import { json } from '@sveltejs/kit';
import { assertConfigured, sessionCallKw, sessionInfo, buildSessionContext, getModel } from '$lib/server/odoo.js';
import { getSession, getContext, clearSessionCookie } from '$lib/server/session.js';

// Must run as a serverless function, never prerendered (it's a POST proxy).
export const prerender = false;

export async function POST({ request, cookies }) {
	try {
		assertConfigured();

		const sid = getSession(cookies);
		if (!sid) return json({ success: false, error: 'Not authenticated' }, { status: 401 });

		const { action, data } = await request.json();
		const MODEL = getModel();

		// Prefer the context captured at login; fall back to a live lookup if the
		// cookie is absent (e.g. a session restored before this was added).
		let ctx = getContext(cookies);
		if (!ctx) ctx = buildSessionContext(await sessionInfo(sid));
		const companyId = ctx.allowed_company_ids?.[0] ?? null;
		const uid = ctx.uid ?? null;

		switch (action) {
			case 'create':
				return json({
					success: true,
					id: await sessionCallKw(sid, MODEL, 'create', [data], { context: ctx })
				});

			case 'search': {
				const { domain = [], fields = [] } = data;
				// Hard-scope to the user's own tenant so a loose/misconfigured record
				// rule can never leak another company's rows into the app.
				const scope = companyId
					? ['x_studio_company_id', '=', companyId]
					: ['create_uid', '=', uid];
				const scopedDomain = [scope, ...domain];
				return json({
					success: true,
					results: await sessionCallKw(sid, MODEL, 'search_read', [scopedDomain], {
						fields,
						context: ctx
					})
				});
			}

			case 'update': {
				const { id, values } = data;
				return json({
					success: true,
					result: await sessionCallKw(sid, MODEL, 'write', [[id], values], { context: ctx })
				});
			}

			case 'delete': {
				const { id } = data;
				return json({
					success: true,
					result: await sessionCallKw(sid, MODEL, 'unlink', [[id]], { context: ctx })
				});
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
