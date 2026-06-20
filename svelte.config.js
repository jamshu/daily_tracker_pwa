import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Static SPA: deploy anywhere. fallback serves the app shell for deep links.
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: 'index.html'
		}),
		paths: {
			// Only needed for sub-path hosting (e.g. GitHub Pages /repo-name/). Empty for root.
			base: process.env.PUBLIC_BASE_PATH ? process.env.PUBLIC_BASE_PATH : ''
		}
	}
};

export default config;
