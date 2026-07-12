// Expense API helpers. Expenses are page-local state (no shared store), but
// every mutation patches budgetData with the server's recomputed actual so
// the budget page stays consistent without a refetch.
import { base } from '$app/paths';
import { budgetData } from './budget.js';

async function post(payload) {
	const res = await fetch(`${base}/api/expenses`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload)
	});
	const body = await res.json().catch(() => ({}));
	if (!res.ok || !body.ok) throw new Error(body.error || 'Could not save expense');
	patchActual(body);
	return body;
}

function patchActual({ month, category, actual }) {
	if (!month || !category) return;
	budgetData.update((d) => ({
		...d,
		[month]: { ...d[month], [category]: { ...d[month]?.[category], actual } }
	}));
}

export async function listExpenses({ month, from, to } = {}) {
	const qs = from && to ? `from=${from}&to=${to}` : `month=${month}`;
	const res = await fetch(`${base}/api/expenses?${qs}`);
	const body = await res.json().catch(() => ({}));
	if (!res.ok || !body.ok) throw new Error(body.error || 'Could not load expenses');
	return { expenses: body.expenses, tags: body.tags ?? [] };
}

export function addTag(name) {
	return post({ action: 'addTag', name });
}

export async function fetchBillImage(id) {
	const res = await fetch(`${base}/api/expenses?image=${id}`);
	const body = await res.json().catch(() => ({}));
	if (!res.ok || !body.ok) throw new Error(body.error || 'Could not load image');
	return body.image;
}

export function addExpense(payload) {
	return post({ action: 'add', ...payload });
}

export function updateExpense(id, payload) {
	return post({ action: 'update', id, ...payload });
}

export function deleteExpense(id) {
	return post({ action: 'delete', id });
}

/**
 * Downscale + JPEG-compress an image File to a base64 payload small enough
 * for JSON-RPC. Returns { image, filename } with the data-URL prefix stripped.
 */
export async function compressImage(file, maxEdge = 1280) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close?.();

	let dataUrl = canvas.toDataURL('image/jpeg', 0.7);
	// ponytail: one retry at lower quality; genuinely incompressible images get rejected server-side
	if (dataUrl.length > 1_400_000) dataUrl = canvas.toDataURL('image/jpeg', 0.5);

	const filename = (file.name || 'bill').replace(/\.[^.]+$/, '') + '.jpg';
	return { image: dataUrl.slice(dataUrl.indexOf(',') + 1), filename };
}
