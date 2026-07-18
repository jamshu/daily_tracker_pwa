import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		// Offline PWA: precache the whole build (incl. prerendered pages — the
		// SvelteKit wrapper runs after the adapter, plain VitePWA misses them) so
		// the installed app works with no internet.
		//
		// injectManifest (not generateSW) because we hand-write src/sw.js: a
		// generated Workbox SW cannot carry a `push` listener, and web push is the
		// whole point of the reminder feature. src/sw.js therefore owns BOTH the
		// offline navigation fallback and the push handlers.
		SvelteKitPWA({
			strategies: 'injectManifest',
			// @vite-pwa/sveltekit compiles SvelteKit's own src/service-worker.js and
			// injects the precache manifest into it, so the source name is fixed.
			srcDir: 'src',
			// Source is fixed (SvelteKit compiles src/service-worker.js); `filename`
			// controls the emitted name. Keep it sw.js so already-installed clients
			// keep updating the same registration instead of orphaning it.
			filename: 'sw.js',
			registerType: 'autoUpdate',
			// SvelteKit has no static index.html for the plugin to inject into —
			// we register manually in +layout.svelte.
			injectRegister: false,
			injectManifest: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}']
			},
			manifest: {
				id: '/',
				name: 'Daily Tracker Local',
				short_name: 'Tracker',
				description: 'Daily ibadah & productivity tracker — your tracked data stays on your device',
				start_url: '/',
				scope: '/',
				display: 'standalone',
				orientation: 'portrait',
				background_color: '#0b1120',
				theme_color: '#0f766e',
				icons: [
					{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
					{ src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
					{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
					{ src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
				]
			}
		})
	]
});
