import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.dailytracker.local',
	appName: 'Daily Tracker Local',
	webDir: 'build',
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
