// Expense helpers, backed by localdb. Expenses are page-local state (no shared
// store), but every mutation patches budgetData with the recomputed actual so
// the budget page stays consistent without a refetch.
import { budgetData } from './budget.js';
import * as localdb from './localdb.js';

function patchActual({ month, category, actual }) {
	if (!month || !category) return;
	budgetData.update((d) => ({
		...d,
		[month]: { ...d[month], [category]: { ...d[month]?.[category], actual } }
	}));
}

export async function listExpenses({ month, from, to } = {}) {
	return localdb.listExpenses({ month, from, to });
}

export async function addTag(name) {
	return { tag: localdb.addTag(name) };
}

export async function fetchBillImage(id) {
	return localdb.getBill(id);
}

export async function addExpense(payload) {
	const body = await localdb.addExpense(payload);
	patchActual(body);
	return body;
}

export async function updateExpense(id, payload) {
	const body = await localdb.updateExpense(id, payload);
	patchActual(body);
	return body;
}

export async function deleteExpense(id) {
	const body = await localdb.deleteExpense(id);
	patchActual(body);
	return body;
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
