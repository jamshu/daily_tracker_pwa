// Client-side auth: talks to the /api/auth/* endpoints. The actual session
// lives in an httpOnly cookie the browser sends automatically — this store only
// holds the current user for the UI.
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { base } from '$app/paths';

// undefined = unknown (still checking) · null = logged out · object = logged in
export const user = writable(undefined);

const url = (p) => `${base}${p}`;

export async function checkSession() {
	if (!browser) return;
	try {
		const res = await fetch(url('/api/auth/me'));
		if (res.ok) {
			const d = await res.json();
			user.set(d.user || null);
		} else {
			user.set(null);
		}
	} catch {
		user.set(null);
	}
}

export async function login(email, password) {
	const res = await fetch(url('/api/auth/login'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	});
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) throw new Error(d.error || 'Login failed');
	user.set(d.user);
	return d.user;
}

export async function signup(name, email, password, sex) {
	const res = await fetch(url('/api/auth/signup'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, email, password, sex })
	});
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) throw new Error(d.error || 'Sign up failed');
	user.set(d.user);
	return d.user;
}

// Step 1: ask the server to email a 6-digit reset code. Always resolves on a
// 2xx so the UI can't be used to probe which emails have accounts.
export async function requestReset(email) {
	const res = await fetch(url('/api/auth/forgot'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email })
	});
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) throw new Error(d.error || 'Could not send reset code');
	return true;
}

// Step 2: submit the code plus the new/confirm password to set it.
export async function resetPassword(email, code, password, confirm) {
	const res = await fetch(url('/api/auth/reset'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, code, password, confirm })
	});
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) throw new Error(d.error || 'Could not reset password');
	return true;
}

// Permanently delete the account and all its data (App Store 5.1.1(v)).
export async function deleteAccount() {
	const res = await fetch(url('/api/auth/delete'), { method: 'POST' });
	const d = await res.json().catch(() => ({}));
	if (!res.ok || !d.ok) throw new Error(d.error || 'Could not delete account');
	user.set(null);
	return true;
}

export async function logout() {
	try {
		await fetch(url('/api/auth/logout'), { method: 'POST' });
	} catch {
		/* ignore */
	}
	user.set(null);
}
