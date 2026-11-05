import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = new URL(process.env.GUIDE_DEPLOY_URL ?? 'https://chrislryu.github.io/di/');
if (!base.pathname.endsWith('/')) base.pathname += '/';
const browser = await chromium.launch({ headless: true });
const errors = new Set();
let inspected = 0;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.add(error.message));
  page.on('response', response => {
    if (response.status() >= 400) errors.add(`${response.status()} ${response.url()}`);
  });
  const visit = async route => {
    const response = await page.goto(new URL(route, base).href, { waitUntil: 'load' });
    assert(response?.ok(), `${route}: HTTP ${response?.status()}`);
    await page.evaluate(() => document.fonts.ready);
    const escaped = await page.locator('a[href]').evaluateAll((nodes, prefix) => nodes
      .map(node => new URL(node.getAttribute('href'), location.href))
      .filter(url => url.origin === location.origin && !url.pathname.startsWith(prefix))
      .map(url => url.href), base.pathname);
    assert.deepEqual(escaped, [], `${route}: navigation escaped the deployment path`);
    inspected++;
  };
  await visit('');
  await page.getByRole('link', { name: 'Follow your first request', exact: true }).click();
  await page.waitForURL(new URL('walkthroughs/one-request/', base).href);
  await visit('start/');
  await page.locator('.system-map svg a[href$="/architecture/nccl/"]').click();
  await page.waitForURL(new URL('architecture/nccl/', base).href);
  await visit('architecture/vllm/repository-map/');
  await page.locator('nav[aria-label="Repository chapters"] a[rel="next"]').click();
  await page.waitForURL(new URL('architecture/vllm/startup/', base).href);
  for (const route of ['architecture/vllm/', 'architecture/libfabric/resource-hierarchy/',
    'architecture/libfabric/efa-operation-trace/', 'architecture/deepep/token-layouts/']) {
    await visit(route);
    assert(await page.locator('pre.mermaid').count(), `${route}: missing diagrams`);
    await page.waitForFunction(() => [...document.querySelectorAll('pre.mermaid')]
      .every(node => node.querySelector('svg') && !node.querySelector('.error-icon, .error-text')),
      undefined, { timeout: 30000 });
  }
  await visit('');
  await page.locator('site-search > button').click();
  await page.locator('dialog[open] .pagefind-ui__search-input').fill('vLLM');
  const result = page.locator('dialog[open] .pagefind-ui__result-link').first();
  await result.waitFor({ timeout: 30000 });
  const resultUrl = new URL(await result.getAttribute('href'), page.url());
  assert(resultUrl.pathname.startsWith(base.pathname), 'Search result escaped the project site');
  await result.click();
  await page.waitForURL(resultUrl.href);
  assert(await page.locator('h1').isVisible());
  await context.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const mobilePage = await mobile.newPage();
  mobilePage.on('pageerror', error => errors.add(error.message));
  for (const route of ['', 'start/', 'architecture/vllm/startup/']) {
    const response = await mobilePage.goto(new URL(route, base).href, { waitUntil: 'load' });
    assert(response?.ok());
    await mobilePage.evaluate(() => document.fonts.ready);
    assert(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route}: mobile overflow`);
    inspected++;
  }
  await mobile.close();
  assert.equal(errors.size, 0, [...errors].join('\n'));
  console.log(`Deployment verified at ${base.href}: ${inspected} page visits, navigation, SVG links, chapter links, Mermaid, Pagefind and mobile layout.`);
} finally {
  await browser.close();
}
