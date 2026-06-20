// Client-rendered SPA: no SSR, prerender the shell, hydrate on the client.
// (Per the svelte-odoo-pwa skill — deep links survive a hard refresh.)
export const prerender = true;
export const ssr = false;
export const csr = true;
