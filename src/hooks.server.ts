import type { Handle } from "@sveltejs/kit/hooks";

const SECURITY_HEADERS = {
  "Content-Security-Policy": "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
  return response;
};
