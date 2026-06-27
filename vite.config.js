import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';


// Vite envPrefix is VITE_ by default; allow PUBLIC_ vars on import.meta.env too,
// and read them idiomatically via $env/dynamic/public in app code.
export default defineConfig({
	plugins: [
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			// Offline-write sync is intentionally NOT included (not needed for this app).
			// This only precaches the app shell so it installs and opens like a native app.
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
				// Import the push notification handler into the generated service worker.
				importScripts: ['/push-handler.js']
			},
			manifest: {
				id: '/',
				name: 'Daily Tracker',
				short_name: 'Tracker',
				description: 'Daily ibadah & productivity tracker',
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
