<script>
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { login, signup, requestReset, resetPassword } from '$lib/auth.js';

	let mode = 'login'; // 'login' | 'signup' | 'forgot' | 'reset'
	let name = '';
	let email = '';
	let password = '';
	let confirm = '';
	let code = '';
	let error = '';
	let notice = '';
	let busy = false;

	$: isSignup = mode === 'signup';
	$: isLogin = mode === 'login';
	$: isForgot = mode === 'forgot';
	$: isReset = mode === 'reset';

	const subText = {
		login: 'Welcome back',
		signup: 'Create your account',
		forgot: 'Reset your password',
		reset: 'Enter your reset code'
	};
	const btnText = {
		login: 'Sign in',
		signup: 'Create account',
		forgot: 'Send reset code',
		reset: 'Set new password'
	};
	const titleText = {
		login: 'Sign in',
		signup: 'Create account',
		forgot: 'Forgot password',
		reset: 'Reset password'
	};

	function setMode(m) {
		mode = m;
		error = '';
		if (m !== 'reset') {
			password = '';
			confirm = '';
			code = '';
		}
	}

	function swap() {
		setMode(isSignup ? 'login' : 'signup');
		notice = '';
	}

	async function submit() {
		error = '';
		busy = true;
		try {
			if (isSignup) {
				await signup(name.trim(), email.trim(), password);
				goto(`${base}/`);
			} else if (isLogin) {
				await login(email.trim(), password);
				goto(`${base}/`);
			} else if (isForgot) {
				await requestReset(email.trim());
				notice = `If an account exists for ${email.trim()}, a 6-digit code has been emailed. Enter it below.`;
				setMode('reset');
			} else if (isReset) {
				if (password !== confirm) throw new Error('Passwords do not match');
				await resetPassword(email.trim(), code.trim(), password, confirm);
				notice = 'Password updated. You can now sign in.';
				setMode('login');
			}
		} catch (e) {
			error = e?.message || 'Something went wrong';
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>{titleText[mode]} · Daily Tracker</title>
</svelte:head>

<div class="wrap">
	<div class="card auth fade-in">
		<div class="brand">
			<span class="logo">
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z" />
				</svg>
			</span>
			<h1>Daily Tracker</h1>
		</div>

		<p class="sub">{subText[mode]}</p>

		{#if notice}<p class="notice">{notice}</p>{/if}

		<form on:submit|preventDefault={submit}>
			{#if isSignup}
				<label>
					<span>Name</span>
					<input type="text" bind:value={name} autocomplete="name" placeholder="Your name" required />
				</label>
			{/if}

			{#if isLogin || isSignup || isForgot || isReset}
				<label>
					<span>Email</span>
					<input
						type="email"
						bind:value={email}
						autocomplete="email"
						placeholder="you@example.com"
						readonly={isReset}
						required
					/>
				</label>
			{/if}

			{#if isReset}
				<label>
					<span>Reset code</span>
					<input
						type="text"
						bind:value={code}
						inputmode="numeric"
						autocomplete="one-time-code"
						placeholder="6-digit code"
						maxlength="6"
						required
					/>
				</label>
			{/if}

			{#if isLogin || isSignup}
				<label>
					<span>Password</span>
					<input
						type="password"
						bind:value={password}
						autocomplete={isSignup ? 'new-password' : 'current-password'}
						placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
						minlength="6"
						required
					/>
				</label>
			{/if}

			{#if isReset}
				<label>
					<span>New password</span>
					<input
						type="password"
						bind:value={password}
						autocomplete="new-password"
						placeholder="At least 6 characters"
						minlength="6"
						required
					/>
				</label>
				<label>
					<span>Confirm password</span>
					<input
						type="password"
						bind:value={confirm}
						autocomplete="new-password"
						placeholder="Re-enter new password"
						minlength="6"
						required
					/>
				</label>
			{/if}

			{#if isLogin}
				<button type="button" class="link forgot" on:click={() => setMode('forgot')}>
					Forgot password?
				</button>
			{/if}

			{#if error}<p class="error">{error}</p>{/if}

			<button class="primary" type="submit" disabled={busy}>
				{#if busy}
					<span class="spinner" />
				{:else}
					{btnText[mode]}
				{/if}
			</button>
		</form>

		{#if isLogin || isSignup}
			<p class="switch">
				{isSignup ? 'Already have an account?' : "Don't have an account?"}
				<button type="button" on:click={swap}>{isSignup ? 'Sign in' : 'Sign up'}</button>
			</p>
		{:else}
			<p class="switch">
				Remembered it?
				<button type="button" on:click={() => setMode('login')}>Back to sign in</button>
			</p>
		{/if}
	</div>
</div>

<style>
	.wrap {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 24px 16px;
	}
	.auth {
		width: 100%;
		max-width: 380px;
		padding: 28px 24px;
	}
	.brand {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		margin-bottom: 6px;
	}
	.logo {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		display: grid;
		place-items: center;
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--gold));
	}
	h1 {
		font-size: 1.25rem;
	}
	.sub {
		text-align: center;
		color: var(--text-dim);
		margin: 0 0 20px;
		font-size: 0.92rem;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	label span {
		font-size: 0.74rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--text-dim);
	}
	input {
		padding: 11px 12px;
		border-radius: var(--radius-sm);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		color: var(--text);
		font-family: inherit;
		font-size: 0.96rem;
		transition: border-color 0.15s ease;
	}
	input:focus {
		outline: none;
		border-color: var(--teal);
	}
	.error {
		margin: 2px 0 0;
		color: var(--red);
		font-size: 0.84rem;
	}
	.notice {
		margin: 0 0 16px;
		padding: 10px 12px;
		border-radius: var(--radius-sm);
		background: var(--bg-soft);
		border: 1px solid var(--border);
		color: var(--text-dim);
		font-size: 0.84rem;
		line-height: 1.4;
	}
	.link {
		align-self: flex-end;
		color: var(--teal);
		font-weight: 600;
		font-size: 0.82rem;
		padding: 0;
	}
	.forgot {
		margin-top: -4px;
	}
	.primary {
		margin-top: 6px;
		height: 44px;
		border-radius: var(--radius-sm);
		font-weight: 700;
		font-size: 0.96rem;
		color: #042f2a;
		background: linear-gradient(135deg, var(--teal), var(--green));
		display: grid;
		place-items: center;
		transition: filter 0.15s ease;
	}
	.primary:hover:not(:disabled) {
		filter: brightness(1.06);
	}
	.primary:disabled {
		opacity: 0.7;
	}
	.switch {
		text-align: center;
		margin: 18px 0 0;
		font-size: 0.88rem;
		color: var(--text-dim);
	}
	.switch button {
		color: var(--teal);
		font-weight: 700;
		padding: 0 2px;
	}
	.spinner {
		width: 18px;
		height: 18px;
		border-radius: 50%;
		border: 2px solid rgba(4, 47, 42, 0.35);
		border-top-color: #042f2a;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
