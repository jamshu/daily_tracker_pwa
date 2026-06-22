// Color themes. Single source of truth, importable from client and server
// (no browser-only deps). The chosen theme id is persisted per-user in
// x_studio_settings and applied via a data-theme attribute on <html>.
// Each theme's palette lives in app.css under :root[data-theme='<id>'].
// `midnight` is the base :root palette (the original default).

export const DEFAULT_THEME = 'midnight';

// swatch = [accent, surface, bg] — three colors shown in the picker preview.
export const THEMES = [
	{ id: 'midnight', name: 'Midnight Teal', swatch: ['#14b8a6', '#111c33', '#0b1120'] },
	{ id: 'claude', name: 'Claude', swatch: ['#c15f3c', '#ffffff', '#faf9f5'] },
	{ id: 'github-light', name: 'GitHub Light', swatch: ['#0969da', '#ffffff', '#f6f8fa'] },
	{ id: 'github-dark', name: 'GitHub Dark', swatch: ['#2f81f7', '#161b22', '#0d1117'] }
];

export const THEME_IDS = THEMES.map((t) => t.id);

export function coerceTheme(id) {
	return THEME_IDS.includes(id) ? id : DEFAULT_THEME;
}
