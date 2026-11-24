import { useEffect, useRef } from "preact/hooks";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onToken: (token: string | null) => void;
  siteKey: string;
}

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) {
    return Promise.resolve();
  }

  const existing = document.querySelector(`#${SCRIPT_ID}`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Turnstile")),
        { once: true }
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile"));
    document.head.appendChild(script);
  });
}

export function TurnstileWidget({ siteKey, onToken }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!(siteKey && containerRef.current)) {
      return;
    }

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => {
        if (!cancelled) {
          onTokenRef.current(null);
        }
      });

    return () => {
      cancelled = true;
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;
      if (widgetId !== null) {
        window.turnstile?.remove(widgetId);
      }
    };
  }, [siteKey]);

  if (!siteKey) {
    return (
      <p class="border-line text-ink-soft rounded-md border border-dashed bg-white/50 px-3 py-3 text-sm">
        Turnstile site key not configured. Add{" "}
        <code class="font-mono text-xs">PUBLIC_TURNSTILE_SITE_KEY</code> to{" "}
        <code class="font-mono text-xs">web/.dev.vars</code> for bot checks.
      </p>
    );
  }

  return <div class="min-h-[65px]" ref={containerRef} />;
}
