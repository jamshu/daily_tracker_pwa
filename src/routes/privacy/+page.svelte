<svelte:head>
	<title>Privacy Policy — Daily Deed Tracker</title>
</svelte:head>

<div class="wrap">
	<article>
		<h1>Privacy Policy</h1>
		<p class="meta">Daily Deed Tracker &mdash; Effective July 18, 2026</p>

		<section>
			<h2>Stays On Your Device</h2>
			<p>There are no accounts, and there is no sign-in. Everything you track is stored only in this app on this device:</p>
			<ul>
				<li><strong>Activity data:</strong> daily deed logs, prayers, habit entries, and productivity records.</li>
				<li><strong>Budget data:</strong> financial entries you record within the app.</li>
				<li><strong>Your name and preferences:</strong> the name you enter on first launch, plus your goals and theme.</li>
			</ul>
			<p>None of this is uploaded. Clearing the app's storage or uninstalling it deletes this data permanently, so use Settings &rarr; Export to keep a backup.</p>
		</section>

		<section>
			<h2>What Leaves Your Device (Only If You Enable Reminders)</h2>
			<p>Daily reminders are the one feature that needs a server, because a notification has to reach you while the app is closed. If — and only if — you turn on <em>Remind me to log my day</em>, we store:</p>
			<ul>
				<li><strong>A push subscription:</strong> the anonymous endpoint your browser generates so notifications can be delivered to this device.</li>
				<li><strong>A random device identifier</strong> created for this install.</li>
				<li><strong>Your reminder time and time zone,</strong> so the reminder arrives at the right moment.</li>
				<li><strong>The name you entered,</strong> used only to label the device record.</li>
			</ul>
			<p>Your tracked data — deeds, prayers, budget — is never sent, even with reminders on. Turning reminders off deletes the subscription and any queued reminders.</p>
		</section>

		<section>
			<h2>Third-Party Services</h2>
			<ul>
				<li><strong>Odoo</strong> — stores the push subscription described above and sends the reminder notifications. Nothing else is stored there.</li>
				<li><strong>Vercel</strong> — hosts the app and serves web requests.</li>
				<li><strong>Your browser's push service</strong> (e.g. Apple, Google, or Mozilla, depending on your device) — relays the notification to you. This is chosen by your browser, not by us.</li>
			</ul>
			<p>We do not sell or share your data, and we do not use it for advertising.</p>
		</section>

		<section>
			<h2>Data Retention &amp; Deletion</h2>
			<p>Turning off reminders in Settings removes your push subscription and pending reminders. To have any remaining record removed, email <a href="mailto:support@dailytracker.odoo.com">support@dailytracker.odoo.com</a>. On-device data is deleted by clearing the app's storage or uninstalling.</p>
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
