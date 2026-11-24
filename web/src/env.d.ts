/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly PUBLIC_TURNSTILE_SITE_KEY?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}

declare namespace Cloudflare {
	interface Env {
		PUBLIC_TURNSTILE_SITE_KEY?: string
	}
}
