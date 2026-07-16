import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		// Offline PWA: precache the whole static build (incl. prerendered pages —
		// the SvelteKit wrapper runs after the adapter, plain VitePWA misses them)
		// so the installed app works with no internet. No push — data is on-device.
		SvelteKitPWA({
			strategies: 'generateSW',
			registerType: 'autoUpdate',
			// SvelteKit has no static index.html for the plugin to inject into —
			// we register manually in +layout.svelte (web only, skipped in Capacitor).
			injectRegister: false,
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff2}']
			},
			manifest: {
				id: '/',
				name: 'Daily Tracker Local',
				short_name: 'Tracker',
				description: 'Daily ibadah & productivity tracker — all data on your device',
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
