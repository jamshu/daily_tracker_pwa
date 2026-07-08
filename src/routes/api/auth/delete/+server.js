import { json } from '@sveltejs/kit';
import {
	assertConfigured,
	adminExecute,
	destroySession,
	getModel,
	sessionInfo
} from '$lib/server/odoo.js';
import { requireUid } from '$lib/server/auth.js';
import {
	getSession,
	getContext,
	clearSessionCookie,
	clearContextCookie
} from '$lib/server/session.js';

export const prerender = false;

// Permanently deletes the authenticated user's account and all their data
// (App Store Guideline 5.1.1(v)). Purges every user-owned model, then the
// res.users record and its tenant res.company.

async function unlinkWhere(model, domain) {
	try {
		const ids = await adminExecute(model, 'search', [domain]);
		if (ids?.length) await adminExecute(model, 'unlink', [ids]);
	} catch (e) {
		console.error(`account delete: purge ${model} failed:`, e.message);
	}
}

export async function POST({ cookies }) {
	try {
		assertConfigured();
		const uid = await requireUid(cookies);

		// tenant company id: from context cookie, else from session info
		let companyId = getContext(cookies)?.allowed_company_ids?.[0] ?? null;
		const sid = getSession(cookies);
		if (!companyId && sid) {
			const { result: info } = await sessionInfo(sid);
			companyId = info?.company_id ?? null;
		}

		// 1) push subscriptions
		await unlinkWhere('x_push_subscription', [['x_studio_user_id', '=', uid]]);

		// 2) leaderboard: own memberships, then owned groups + their members
		await unlinkWhere('x_lb_member', [['x_studio_user_id', '=', uid]]);
		try {
			const ownedGroups = await adminExecute('x_lb_group', 'search', [
				[['x_studio_owner_id', '=', uid]]
			]);
			if (ownedGroups?.length) {
				await unlinkWhere('x_lb_member', [['x_studio_group_id', 'in', ownedGroups]]);
				await adminExecute('x_lb_group', 'unlink', [ownedGroups]);
			}
		} catch (e) {
			console.error('account delete: purge owned groups failed:', e.message);
		}

		// 3) activities + their goals
		try {
			const acts = await adminExecute(
				'x_activities',
				'search_read',
				[[['x_studio_user_id', '=', uid]]],
				{ fields: ['id', 'x_studio_goal_id'] }
			);
			if (acts?.length) {
				const goalIds = acts
					.map((a) => (Array.isArray(a.x_studio_goal_id) ? a.x_studio_goal_id[0] : null))
					.filter(Boolean);
				await adminExecute('x_activities', 'unlink', [acts.map((a) => a.id)]);
				if (goalIds.length) await unlinkWhere('x_goals', [['id', 'in', goalIds]]);
			}
		} catch (e) {
			console.error('account delete: purge activities failed:', e.message);
		}

		// 4) company-scoped data
		if (companyId) {
			await unlinkWhere('x_expense', [['x_studio_company_id', '=', companyId]]);
			await unlinkWhere('x_budget', [['x_studio_company_id', '=', companyId]]);
		}

		// 5) user-created records
		await unlinkWhere('x_todo', [['create_uid', '=', uid]]);
		await unlinkWhere(getModel(), [['create_uid', '=', uid]]);

		// 6) the account itself
		if (sid) await destroySession(sid);
		try {
			await adminExecute('res.users', 'unlink', [[uid]]);
		} catch (e) {
			// Odoo can refuse to unlink users referenced by logs/messages —
			// anonymize instead so no personal data remains.
			console.error('account delete: user unlink failed, anonymizing:', e.message);
			await adminExecute('res.users', 'write', [
				[uid],
				{
					active: false,
					name: 'Deleted User',
					login: `deleted-${uid}@deleted.invalid`,
					email: `deleted-${uid}@deleted.invalid`,
					x_studio_settings: '',
					password: crypto.randomUUID()
				}
			]);
		}
		if (companyId) {
			try {
				await adminExecute('res.company', 'unlink', [[companyId]]);
			} catch (e) {
				console.error('account delete: company unlink failed:', e.message);
			}
		}

		clearSessionCookie(cookies);
		clearContextCookie(cookies);
		return json({ ok: true });
	} catch (e) {
		const status = e.status || 500;
		if (status === 401) {
			clearSessionCookie(cookies);
			clearContextCookie(cookies);
		}
		return json({ ok: false, error: e.message || 'Could not delete account' }, { status });
	}
}
