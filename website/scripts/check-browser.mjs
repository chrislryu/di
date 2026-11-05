import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { frontmatter } from './check-guides.mjs';

const website = fileURLToPath(new URL('../', import.meta.url));
const origin = process.env.GUIDE_PREVIEW_URL ?? 'http://127.0.0.1:4322';
const artifacts = path.join(website, '.qa');
const failures = [];
const checks = [];
const browserErrors = new Set();

async function filesIn(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => entry.isDirectory()
    ? filesIn(path.join(directory, entry.name)) : [path.join(directory, entry.name)]));
  return nested.flat();
}

async function executablePath() {
  const standard = chromium.executablePath();
  try { await fs.access(standard); return standard; } catch { /* Check cached browser revisions. */ }
  const cache = path.join(os.homedir(), '.cache/ms-playwright');
  const cached = await fs.readdir(cache).catch(() => []);
  const revisions = cached.filter(name => /^chromium-\d+$/.test(name)).sort().reverse();
  for (const revision of revisions) {
    for (const binary of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
      const candidate = path.join(cache, revision, binary);
      try { await fs.access(candidate); return candidate; } catch { /* Try the next cached executable. */ }
    }
  }
  throw new Error(`No Chromium executable found; install with npx playwright install chromium. Expected ${standard}`);
}

async function waitForPreview() {
  for (let attempt = 0; attempt < 15; attempt++) {
    try {
      const response = await fetch(origin, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch { /* A production preview may still be starting. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Production preview is unavailable at ${origin}. Run npm run preview -- --host 127.0.0.1 --port 4322.`);
}

async function check(name, fn) {
  try { await fn(); checks.push(name); console.log(`PASS ${name}`); }
  catch (error) { failures.push(`${name}: ${error.message}`); console.error(`FAIL ${name}: ${error.message}`); }
}

async function visit(page, route) {
  const response = await page.goto(new URL(route, origin).href, { waitUntil: 'networkidle' });
  assert(response?.ok(), `${route} returned ${response?.status()}`);
  await page.evaluate(() => document.fonts.ready);
}

async function renderedDiagrams(page, expected, route) {
  const diagrams = page.locator('pre.mermaid');
  assert.equal(await diagrams.count(), expected, `${route} Mermaid block count`);
  if (!expected) return;
  await page.waitForFunction(() => [...document.querySelectorAll('pre.mermaid')].every(node => node.hasAttribute('data-processed')), undefined, { timeout: 20000 });
  const results = await diagrams.evaluateAll(nodes => nodes.map(node => ({
    svgCount: node.querySelectorAll('svg').length,
    text: (node.textContent ?? '').slice(0, 500),
    error: /syntax error|parse error|mermaid rendering error/i.test(node.textContent ?? '') || Boolean(node.querySelector('.error-icon, .error-text')),
  })));
  for (const [index, result] of results.entries()) {
    assert.equal(result.svgCount, 1, `${route} diagram ${index + 1} has no rendered SVG: ${result.text}`);
    assert(!result.error, `${route} diagram ${index + 1} rendered an error`);
  }
}

// Use Tab rather than programmatic focus to verify the link participates in the
// browser's actual keyboard order. Each target is tested from a fresh page load.
async function tabTo(page, locator, limit = 160) {
  await locator.waitFor({ state: 'visible' });
  for (let index = 0; index < limit; index++) {
    await page.keyboard.press('Tab');
    if (await locator.evaluate(node => node === document.activeElement)) return;
  }
  throw new Error(`Link was not reachable within ${limit} Tab presses`);
}

async function noDocumentOverflow(page, route) {
  const size = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  assert(size.document <= size.viewport + 1 && size.body <= size.viewport + 1,
    `${route} has document overflow: viewport=${size.viewport}, html=${size.document}, body=${size.body}`);
}

async function textContrast(page) {
  // Sample the actual composited foreground/background of ordinary prose. This
  // complements screenshots; it is not a replacement for a full accessibility audit.
  return page.locator('.sl-markdown-content p').first().evaluate(node => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    function rgba(color) {
      context.clearRect(0, 0, 1, 1); context.fillStyle = color; context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data].map((value, i) => i < 3 ? value / 255 : value / 255);
    }
    function over(foreground, background) {
      const alpha = foreground[3];
      return [0, 1, 2].map(i => foreground[i] * alpha + background[i] * (1 - alpha)).concat(1);
    }
    const ancestors = []; let current = node;
    while (current) { ancestors.unshift(current); current = current.parentElement; }
    let background = [1, 1, 1, 1];
    for (const element of ancestors) background = over(rgba(getComputedStyle(element).backgroundColor), background);
    const foreground = over(rgba(getComputedStyle(node).color), background);
    const luminance = color => color.slice(0, 3).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
      .reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
    const f = luminance(foreground); const b = luminance(background);
    return (Math.max(f, b) + .05) / (Math.min(f, b) + .05);
  });
}

await waitForPreview();
await fs.mkdir(artifacts, { recursive: true });
const contentDirectory = path.join(website, 'src/content/docs');
const content = (await filesIn(contentDirectory)).filter(file => /\.mdx?$/.test(file));
const pages = (await Promise.all(content.map(async file => {
  const source = await fs.readFile(file, 'utf8');
  if (frontmatter(source).draft === true) return undefined;
  const id = path.relative(contentDirectory, file).replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');
  return { route: `/${id}${id ? '/' : ''}`, diagrams: (source.match(/^```mermaid\s*$/gm) ?? []).length };
}))).filter(Boolean);
const registry = JSON.parse(await fs.readFile(path.join(website, 'src/data/guides.json'), 'utf8'));
const sourceProjects = JSON.parse(await fs.readFile(path.join(website, 'src/data/sources.json'), 'utf8'));

const browser = await chromium.launch({ executablePath: await executablePath(), headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  const page = await context.newPage();
  page.on('pageerror', error => browserErrors.add(error.message));

  for (const item of pages.filter(item => item.diagrams)) {
    await check(`Mermaid ${item.route} (${item.diagrams})`, async () => {
      await visit(page, item.route); await renderedDiagrams(page, item.diagrams, item.route);
    });
  }

  await check('Homepage CTA keyboard navigation', async () => {
    await visit(page, '/');
    await tabTo(page, page.getByRole('link', { name: 'Follow your first request', exact: true }));
    await page.keyboard.press('Enter'); await page.waitForURL('**/walkthroughs/one-request/');
  });

  await check('System map keyboard links and text alternative', async () => {
    await visit(page, '/');
    const map = page.locator('.system-map');
    assert.equal(await map.locator('svg a[href]').count(), 10, 'All ten projects should be linked');
    await map.getByText('Read the map as text and inspect the evidence').click();
    assert(await map.locator('details').evaluate(node => node.open), 'Text map should expand');
    assert.equal(await map.locator('details li').count(), 7, 'All seven selected relationships should be explained');
    await tabTo(page, map.getByRole('link', { name: 'Dynamo architecture guide', exact: true }));
    await page.keyboard.press('Enter'); await page.waitForURL('**/architecture/dynamo/');
  });

  await check('Project index keyboard navigation', async () => {
    await visit(page, '/architecture/');
    const projectLink = page.locator('.project-card[href="/architecture/vllm/"]');
    await tabTo(page, projectLink);
    await page.keyboard.press('Enter'); await page.waitForURL('**/architecture/vllm/');
  });

  await check('Production Pagefind search finds vLLM', async () => {
    await visit(page, '/');
    await page.locator('site-search > button').click();
    const input = page.locator('dialog[open] .pagefind-ui__search-input');
    await input.fill('vLLM');
    await page.waitForSelector('dialog[open] .pagefind-ui__result-link', { timeout: 20000 });
    const result = page.locator('dialog[open] .pagefind-ui__result-link[href*="/architecture/vllm/"]').first();
    await result.waitFor({ state: 'visible' });
    await result.click(); await page.waitForURL('**/architecture/vllm/**');
    assert.match(await page.locator('h1').innerText(), /vLLM/);
  });

  // Boundary checks exercise the order and end conditions, rather than merely
  // proving that every chapter route returns a successful HTTP response.
  for (const [project, guide] of Object.entries(registry)) {
    const overview = '/architecture/' + project + '/';
    await check(project + ' overview chapter list', async () => {
      await visit(page, overview);
      const links = page.locator('[data-guide-chapters="' + project + '"] a');
      assert.deepEqual(await links.evaluateAll(nodes => nodes.map(node => node.getAttribute('href'))), guide.chapters.map(chapter => overview + chapter.slug + '/'));
    });
    for (const index of [0, Math.floor((guide.chapters.length - 1) / 2), guide.chapters.length - 1]) {
      const chapter = guide.chapters[index];
      await check(project + ' chapter boundary ' + chapter.slug, async () => {
        await visit(page, overview + chapter.slug + '/');
        const navigation = page.getByRole('navigation', { name: 'Repository chapters', exact: true });
        assert.match(await page.locator('body').innerText(), new RegExp('Chapter\\s+' + (index + 2) + '\\s+of\\s+' + (guide.chapters.length + 1)));
        const previous = navigation.locator('a[rel="prev"]');
        assert.equal(await previous.getAttribute('href'), index ? overview + guide.chapters[index - 1].slug + '/' : overview);
        const next = navigation.locator('a[rel="next"]');
        assert.equal(await next.count(), index + 1 < guide.chapters.length ? 1 : 0);
        if (index + 1 < guide.chapters.length) assert.equal(await next.getAttribute('href'), overview + guide.chapters[index + 1].slug + '/');
        assert(await navigation.locator('a[href="' + overview + '"]').count() > 0);
        assert(await page.getByRole('navigation', {name:'Breadcrumb',exact:true}).locator('a[href="' + overview + '"]').count() > 0);
      });
    }
  }

  for (const [project, slug] of [['vllm','kv-memory'], ['nixl','registration'], ['libfabric','capability-negotiation']]) {
    const chapter = registry[project].chapters.find(item => item.slug === slug);
    await check('Subsystem search ' + project + '/' + slug, async () => {
      await visit(page, '/');
      await page.locator('site-search > button').click();
      const input = page.locator('dialog[open] .pagefind-ui__search-input');
      await input.fill(sourceProjects[project].name + ' ' + chapter.title);
      const result = page.locator('dialog[open] .pagefind-ui__result-link[href*="/architecture/' + project + '/' + slug + '/"]').first();
      await result.waitFor({state:'visible',timeout:20000});
      await result.click();
      await page.waitForURL('**/architecture/' + project + '/' + slug + '/**');
    });
  }

  await check('Chapter next link keyboard activation', async () => {
    const first = registry.vllm.chapters[0], next = registry.vllm.chapters[1];
    await visit(page, '/architecture/vllm/' + first.slug + '/');
    const link = page.getByRole('navigation', {name:'Repository chapters',exact:true}).locator('a[rel="next"]');
    await link.focus(); await page.keyboard.press('Enter');
    await page.waitForURL('**/architecture/vllm/' + next.slug + '/');
  });

  for (const theme of ['light', 'dark']) {
    await check(`Homepage ${theme} text contrast and screenshot`, async () => {
      await visit(page, '/');
      await page.locator('starlight-theme-select select').selectOption(theme);
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      const contrast = await textContrast(page);
      assert(contrast >= 4.5, `Prose contrast is ${contrast.toFixed(2)}:1, expected >=4.5:1`);
      await page.screenshot({ path: path.join(artifacts, `homepage-${theme}.png`), fullPage: true });
    });
  }

  await context.close();
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
  const mobilePage = await mobile.newPage();
  mobilePage.on('pageerror', error => browserErrors.add(error.message));
  for (const item of pages) {
    await check(`Mobile layout ${item.route}`, async () => {
      await visit(mobilePage, item.route);
      await renderedDiagrams(mobilePage, item.diagrams, item.route);
      await noDocumentOverflow(mobilePage, item.route);
    });
  }
  await check('Mobile chapter sidebar navigation', async () => {
    const first = registry.vllm.chapters[0], middle = registry.vllm.chapters[6];
    await visit(mobilePage, '/architecture/vllm/' + first.slug + '/');
    await mobilePage.getByRole('button', {name:'Menu',exact:true}).click();
    const link = mobilePage.locator('a[href="/architecture/vllm/' + middle.slug + '/"]').first();
    assert(await link.isVisible(), 'The active repository chapter group should be expanded');
    await link.click(); await mobilePage.waitForURL('**/architecture/vllm/' + middle.slug + '/');
    await noDocumentOverflow(mobilePage, '/architecture/vllm/' + middle.slug + '/');
  });
  for (const theme of ['light', 'dark']) {
    await check(`vLLM mobile ${theme} screenshot`, async () => {
      await visit(mobilePage, '/architecture/vllm/');
      await mobilePage.getByRole('button', { name: 'Menu', exact: true }).click();
      await mobilePage.locator('starlight-theme-select select:visible').selectOption(theme);
      await mobilePage.getByRole('button', { name: 'Menu', exact: true }).click();
      await renderedDiagrams(mobilePage, pages.find(item => item.route === '/architecture/vllm/').diagrams, '/architecture/vllm/');
      const contrast = await textContrast(mobilePage);
      assert(contrast >= 4.5, `Mobile prose contrast is ${contrast.toFixed(2)}:1`);
      await mobilePage.screenshot({ path: path.join(artifacts, `vllm-mobile-${theme}.png`), fullPage: true });
    });
  }
  await mobile.close();
  await check('No uncaught browser JavaScript errors', async () => assert.equal(browserErrors.size, 0, [...browserErrors].join('\n')));
} finally {
  await browser.close();
}

await fs.writeFile(path.join(artifacts, 'browser-results.json'), JSON.stringify({ origin, pages: pages.length, checks, failures, browserErrors: [...browserErrors] }, null, 2) + '\n');
console.log(`\n${checks.length} checks passed; ${failures.length} failed. Artifacts: ${artifacts}`);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
