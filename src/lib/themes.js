// Color themes. Single source of truth, importable from client and server
// (no browser-only deps). The chosen theme id is persisted per-user in
// x_studio_settings and applied via a data-theme attribute on <html>.
// Each theme's palette lives in app.css under :root[data-theme='<id>'].
// `midnight` is the base :root palette; `catppuccin-latte` is the default
// applied for new users (and as the pre-paint fallback in app.html).

export const DEFAULT_THEME = 'catppuccin-latte';

// swatch = [accent, surface, bg] — three colors shown in the picker preview.
// `dark` drives the moon light↔dark toggle (counters screen).
export const THEMES = [
	{ id: 'midnight', name: 'Midnight Teal', swatch: ['#14b8a6', '#111c33', '#0b1120'], dark: true },
	{ id: 'claude', name: 'Claude', swatch: ['#c15f3c', '#ffffff', '#faf9f5'], dark: false },
	{ id: 'github-light', name: 'GitHub Light', swatch: ['#0969da', '#ffffff', '#f6f8fa'], dark: false },
	{ id: 'github-dark', name: 'GitHub Dark', swatch: ['#2f81f7', '#161b22', '#0d1117'], dark: true },
	{ id: 'rose-pine', name: 'Rosé Pine', swatch: ['#ebbcba', '#1f1d2e', '#191724'], dark: true },
	{ id: 'nord', name: 'Nord', swatch: ['#88c0d0', '#3b4252', '#2e3440'], dark: true },
	{ id: 'catppuccin-latte', name: 'Catppuccin Latte', swatch: ['#8839ef', '#ffffff', '#eff1f5'], dark: false },
	{ id: 'everforest-light', name: 'Everforest Light', swatch: ['#35a77c', '#fffbef', '#fdf6e3'], dark: false }
];

export const THEME_IDS = THEMES.map((t) => t.id);

export function coerceTheme(id) {
	return THEME_IDS.includes(id) ? id : DEFAULT_THEME;
}

/** True if the given theme id is a dark theme. */
export function isDarkTheme(id) {
	return THEMES.find((t) => t.id === id)?.dark === true;
}
