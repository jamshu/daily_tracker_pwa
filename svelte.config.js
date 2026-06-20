import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Vercel adapter: prerendered page shell is served statically, while the
		// /api/odoo server route is deployed as a serverless function.
		adapter: adapter(),
		paths: {
			// Only needed for sub-path hosting (e.g. GitHub Pages /repo-name/). Empty for root.
			base: process.env.PUBLIC_BASE_PATH ? process.env.PUBLIC_BASE_PATH : ''
		}
	}
};

export default config;
