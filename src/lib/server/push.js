import webpush from 'web-push';
import { createSign } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { adminExecute } from './odoo.js';

const SUB_MODEL = 'x_push_subscription';

// ─── VAPID ──────────────────────────────────────────────────────────────────

let vapidSet = false;
function ensureVapid() {
	if (vapidSet) return;
	let subject = (env.VAPID_SUBJECT || '').trim();
	if (subject && !/^(mailto:|https?:)/.test(subject)) {
		subject = subject.includes('@') ? `mailto:${subject}` : `https://${subject}`;
	}
	const pub = (env.VAPID_PUBLIC_KEY || '').trim();
	const priv = (env.VAPID_PRIVATE_KEY || '').trim();
	console.log(
		`[push] vapid setup: subject=${subject || 'MISSING'} pubLen=${pub.length} privLen=${priv.length}`
	);
	webpush.setVapidDetails(subject, pub, priv);
	vapidSet = true;
}

// ─── FCM HTTP v1 (no firebase-admin — uses raw JWT + REST) ──────────────────

let _serviceAccount = null;
function getServiceAccount() {
	if (_serviceAccount) return _serviceAccount;
	const raw = (env.FIREBASE_SERVICE_ACCOUNT || '').trim();
	if (!raw) return null;
	try {
		_serviceAccount = JSON.parse(raw);
		return _serviceAccount;
	} catch {
		console.error('[push] FIREBASE_SERVICE_ACCOUNT is not valid JSON');
		return null;
	}
}

function base64url(str) {
	return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

let _fcmAccessToken = null;
let _fcmTokenExpiry = 0;

async function getFcmAccessToken() {
	if (_fcmAccessToken && Date.now() < _fcmTokenExpiry) return _fcmAccessToken;

	const sa = getServiceAccount();
	if (!sa) return null;

	const now = Math.floor(Date.now() / 1000);
	const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
	const payload = base64url(
		JSON.stringify({
			iss: sa.client_email,
			scope: 'https://www.googleapis.com/auth/firebase.messaging',
			aud: 'https://oauth2.googleapis.com/token',
			iat: now,
			exp: now + 3600
		})
	);

	const signer = createSign('RSA-SHA256');
	signer.update(`${header}.${payload}`);
	const sig = signer.sign(sa.private_key, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'urn:ietf:params:oauth2:jwt-bearer',
			assertion: `${header}.${payload}.${sig}`
		})
	});

	if (!res.ok) {
		console.error('[push] FCM OAuth token exchange failed:', await res.text());
		return null;
	}

	const { access_token, expires_in } = await res.json();
	_fcmAccessToken = access_token;
	_fcmTokenExpiry = Date.now() + (expires_in - 60) * 1000;
	return _fcmAccessToken;
}

async function sendFCM(token, payload) {
	const sa = getServiceAccount();
	if (!sa) {
		console.warn('[push] FIREBASE_SERVICE_ACCOUNT not set — skipping native push');
		return;
	}

	const accessToken = await getFcmAccessToken();
	if (!accessToken) return;

	const message = {
		message: {
			token,
			notification: { title: payload.title, body: payload.body },
			...(payload.url ? { data: { url: String(payload.url) } } : {}),
			android: {
				priority: 'high',
				notification: { channel_id: 'default' }
			},
			apns: { headers: { 'apns-priority': '10' } }
		}
	};

	const res = await fetch(
		`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`
			},
			body: JSON.stringify(message)
		}
	);

	if (!res.ok) {
		const body = await res.text();
		console.error(`[push] FCM send failed: status=${res.status} body=${body.slice(0, 200)}`);
		if (res.status === 404 || body.includes('UNREGISTERED') || body.includes('NOT_FOUND')) {
			await removeStaleSub(token);
		}
		// Invalidate cached token on auth errors so next call re-fetches
		if (res.status === 401) { _fcmAccessToken = null; _fcmTokenExpiry = 0; }
	}
}

// ─── Shared ──────────────────────────────────────────────────────────────────

async function removeStaleSub(endpoint) {
	try {
		const ids = await adminExecute(SUB_MODEL, 'search', [[['x_studio_endpoint', '=', endpoint]]]);
		if (ids.length) await adminExecute(SUB_MODEL, 'unlink', [ids]);
	} catch {
		/* best-effort */
	}
}

/** Send a push to one subscription {endpoint, keys:{p256dh, auth}}.
 *  When keys.auth === 'fcm', routes to FCM HTTP v1 instead of VAPID. */
export async function sendPush(sub, payload) {
	if (sub.keys?.auth === 'fcm') {
		await sendFCM(sub.endpoint, payload);
		return;
	}
	try {
		ensureVapid();
		await webpush.sendNotification(sub, JSON.stringify(payload));
	} catch (err) {
		console.error(
			`[push] sendNotification failed: status=${err.statusCode} body=${err.body} msg=${err.message} endpoint=${sub.endpoint?.slice(0, 40)}`
		);
		if (err.statusCode === 404 || err.statusCode === 410) {
			await removeStaleSub(sub.endpoint);
		}
	}
}

/** Send to all devices registered for one user. */
export async function sendToUser(userId, payload) {
	const rows = await adminExecute(
		SUB_MODEL,
		'search_read',
		[[['x_studio_user_id', '=', userId]]],
		{ fields: ['x_studio_endpoint', 'x_studio_keys_p256dh', 'x_studio_keys_auth'] }
	);
	await Promise.allSettled(
		rows.map((r) =>
			sendPush(
				{
					endpoint: r.x_studio_endpoint,
					keys: { p256dh: r.x_studio_keys_p256dh, auth: r.x_studio_keys_auth }
				},
				payload
			)
		)
	);
}

/** Broadcast to all subscribed users. Returns subscriber count. */
export async function sendToAll(payload) {
	const rows = await adminExecute(SUB_MODEL, 'search_read', [[]], {
		fields: ['x_studio_user_id', 'x_studio_endpoint', 'x_studio_keys_p256dh', 'x_studio_keys_auth']
	});
	console.log(`[push] sendToAll: ${rows.length} subscription(s) found`);
	if (!rows.length) return 0;
	const results = await Promise.allSettled(
		rows.map((r) =>
			sendPush(
				{
					endpoint: r.x_studio_endpoint,
					keys: { p256dh: r.x_studio_keys_p256dh, auth: r.x_studio_keys_auth }
				},
				payload
			)
		)
	);
	const failed = results.filter((r) => r.status === 'rejected').length;
	if (failed) console.error(`[push] sendToAll: ${failed}/${rows.length} push(es) failed`);
	return rows.length;
}
