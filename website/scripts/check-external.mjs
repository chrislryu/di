import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inspectHtml, walkFiles } from './check-content.mjs';

/** Rate limits, access restrictions, and server/network failures stay unresolved. */
export function classifyStatus(status) {
  if (status >= 200 && status < 400) return 'valid';
  if ([404, 410].includes(status)) return 'broken';
  return 'unresolved';
}

export async function checkExternalLink(url, fetcher = fetch) {
  try {
    let response = await fetcher(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(15000) });
    if ([405, 501].includes(response.status)) response = await fetcher(url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15000) });
    // GET fallback does not need the potentially large source page body.
    await response.body?.cancel();
    return { url, status: response.status, result: classifyStatus(response.status) };
  } catch (error) { return { url, result: 'unresolved', reason: error.name }; }
}

export async function checkExternal({ dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist'), concurrency = 3 } = {}) {
  const urls = new Set();
  for (const filename of walkFiles(dist, '.html')) {
    for (const { value } of inspectHtml(fs.readFileSync(filename, 'utf8')).references) {
      if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/blob\//.test(value)) {
        const url = new URL(value); url.hash = ''; urls.add(url.href);
      }
    }
  }
  const remaining = [...urls], results = [];
  await Promise.all(Array.from({ length: Math.min(concurrency, remaining.length) }, async () => {
    while (remaining.length) {
      const url = remaining.shift();
      const result = await checkExternalLink(url);
      results.push(result);
      if (result.result !== 'valid') console.log(`${result.result.toUpperCase()} ${result.status ?? result.reason} ${url}`);
    }
  }));
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const results = await checkExternal();
  const count = status => results.filter(result => result.result === status).length;
  console.log(`External source links: ${count('valid')} valid, ${count('broken')} broken, ${count('unresolved')} unresolved.`);
  if (!results.length) { console.error('No source links found. Build the site first.'); process.exitCode = 1; }
  else process.exitCode = count('broken') ? 1 : 0;
}
