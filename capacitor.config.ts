import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.dailytracker.dailydeedtracker',
	appName: 'Daily Deed Tracker',
	webDir: 'capacitor-shell',
	server: {
		url: 'https://deedapp.net',
		cleartext: false,
		allowNavigation: ['deedapp.net', '*.deedapp.net']
	},
	ios: { contentInset: 'never', backgroundColor: '#0b1120' },
	android: { backgroundColor: '#0b1120' },
	plugins: {
		SplashScreen: {
			launchAutoHide: true,
			backgroundColor: '#0b1120',
			showSpinner: false
		}
	}
};

export default config;
