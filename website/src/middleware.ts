import { defineMiddleware } from 'astro:middleware';
import { normalizeBase, rewriteHtmlBase } from './lib/site-paths';

// Runs while Astro prerenders HTML, before Pagefind indexes the resulting pages.
// Handles Markdown, MDX cards, SVG map links and custom navigation in one place.
export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (!normalizeBase(import.meta.env.BASE_URL) || !response.headers.get('content-type')?.includes('text/html')) return response;
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(rewriteHtmlBase(await response.text(), import.meta.env.BASE_URL), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
