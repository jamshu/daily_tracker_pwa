// Tell the prerenderer which sets exist (route is reached via goto, not crawlable links).
export function entries() {
	return [{ set: 'morning' }, { set: 'evening' }, { set: 'afterSalah' }];
}
