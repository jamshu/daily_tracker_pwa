<svelte:head>
	<title>Support — Daily Deed Tracker</title>
</svelte:head>

<div class="wrap">
	<article>
		<h1>Support</h1>
		<p class="meta">Daily Deed Tracker &mdash; we're here to help</p>

		<section>
			<h2>Contact</h2>
			<p>Questions, feedback, or a problem? Email us at <a href="mailto:support@dailytracker.odoo.com">support@dailytracker.odoo.com</a> and we'll get back to you.</p>
		</section>

		<section>
			<h2>Frequently Asked</h2>
			<ul>
				<li><strong>Not receiving notifications?</strong> Open Settings and make sure notifications are enabled, then grant permission when prompted. On iPhone, add the app to your Home Screen first, then enable notifications.</li>
				<li><strong>Forgot your password?</strong> On the login screen, use the password reset link and follow the emailed instructions.</li>
				<li><strong>Want to delete your account and data?</strong> Email <a href="mailto:support@dailytracker.odoo.com">support@dailytracker.odoo.com</a> and we'll remove your account and all associated data.</li>
				<li><strong>Why do prayer scores differ for men and women?</strong> Scoring follows Islamic rulings on where the prayer is performed — for example, women praying at home receive the same reward as congregation (Jamāʿah). Set your profile in Settings.</li>
				<li><strong>How is my daily progress calculated?</strong> Your progress ring reflects the deeds you log each day. The true reward is with God, weighed by your sincerity and intention.</li>
			</ul>
		</section>

		<section>
			<h2>Privacy</h2>
			<p>Read how we handle your data in our <a href="/privacy">Privacy Policy</a>.</p>
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
	@media (hover: hover) {
		a:hover {
			text-decoration: underline;
		}
	}
	a:active {
		text-decoration: underline;
	}
	strong {
		color: #e2e8f0;
	}
</style>
