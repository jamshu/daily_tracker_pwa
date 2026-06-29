<svelte:head>
	<title>Privacy Policy — Daily Deed Tracker</title>
</svelte:head>

<div class="wrap">
	<article>
		<h1>Privacy Policy</h1>
		<p class="meta">Daily Deed Tracker &mdash; Effective June 29, 2026</p>

		<section>
			<h2>What We Collect</h2>
			<ul>
				<li><strong>Account information:</strong> name and email address used to create your account.</li>
				<li><strong>Activity data:</strong> daily deed logs, habit entries, and productivity records you create.</li>
				<li><strong>Budget data:</strong> financial entries you record within the app.</li>
				<li><strong>Push notification tokens:</strong> FCM/APNs device tokens, stored only to deliver notifications you request.</li>
			</ul>
		</section>

		<section>
			<h2>How We Use It</h2>
			<p>Your data is used solely to operate the app — display your records, sync across devices, and send notifications you enable. We do not sell, share, or use your data for advertising.</p>
		</section>

		<section>
			<h2>Third-Party Services</h2>
			<ul>
				<li><strong>Odoo</strong> — backend database where your account and activity data is stored.</li>
				<li><strong>Firebase (Google FCM)</strong> — delivers push notifications to your device.</li>
				<li><strong>Vercel</strong> — hosts the app and serves all web requests.</li>
			</ul>
			<p>Each service processes data only as needed to provide the above functions.</p>
		</section>

		<section>
			<h2>Data Retention &amp; Deletion</h2>
			<p>Your data is retained for as long as your account is active. To request deletion of your account and all associated data, email us at <a href="mailto:support@dailytracker.odoo.com">support@dailytracker.odoo.com</a>.</p>
		</section>

		<section>
			<h2>Contact</h2>
			<p>Questions? <a href="mailto:support@dailytracker.odoo.com">support@dailytracker.odoo.com</a></p>
		</section>
	</article>
</div>

<style>
	:global(body) {
		background: #0b1120;
		color: #e2e8f0;
	}
	.wrap {
		min-height: 100dvh;
		display: flex;
		justify-content: center;
		padding: 3rem 1.5rem;
		padding-top: max(3rem, env(safe-area-inset-top));
		padding-bottom: max(3rem, env(safe-area-inset-bottom));
	}
	article {
		max-width: 640px;
		width: 100%;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.7;
	}
	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 0.25rem;
		color: #f1f5f9;
	}
	.meta {
		color: #64748b;
		font-size: 0.875rem;
		margin: 0 0 2.5rem;
	}
	h2 {
		font-size: 1.1rem;
		font-weight: 600;
		color: #94a3b8;
		margin: 2rem 0 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-size: 0.8rem;
	}
	p, li {
		color: #cbd5e1;
		font-size: 0.95rem;
	}
	ul {
		padding-left: 1.25rem;
		margin: 0.5rem 0;
	}
	li {
		margin-bottom: 0.4rem;
	}
	a {
		color: #5eead4;
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
	}
	strong {
		color: #e2e8f0;
	}
</style>
