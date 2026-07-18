import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Vercel: pages are still prerendered (see +layout.js) and precached by the
		// service worker, but we need serverless routes under /api so the Odoo admin
		// API key stays server-side — a fully static build can't hold a secret.
		adapter: adapter(),
		prerender: { handleUnseenRoutes: 'ignore' }
	}
};

export default config;
