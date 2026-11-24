import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = ({ request }) => {
  if (
    request.headers.get("content-type")?.includes("application/json") !== true
  ) {
    return new Response(
      JSON.stringify({ error: "Expected application/json body" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Scaffold stub: Zod, Turnstile, KV quotas, and buildPlan land in a later pass.
  return new Response(
    JSON.stringify({
      error: "Not implemented",
    }),
    {
      status: 501,
      headers: { "Content-Type": "application/json" },
    }
  );
};
