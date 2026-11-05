import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { checkSite, inspectHtml, validateManifest } from './check-content.mjs';
import { checkExternalLink, classifyStatus } from './check-external.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'field-guide-check-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const options = {
    dist: path.join(root, 'dist'), sourceManifest: path.join(root, 'sources.json'),
    repositoryRoot: path.join(root, 'repositories'), researchDir: path.join(root, 'research'),
  };
  const write = (name, value) => {
    const filename = path.join(root, name);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, value);
  };
  const manifest = { sample: { name: 'Sample', origin: 'https://github.com/example/sample', commit: 'a'.repeat(40), reviewed: '2026-11-04' } };
  write('sources.json', JSON.stringify(manifest));
  write('research/evidence.json', '[]');
  write('dist/index.html', '<!doctype html><title>Guide</title>');
  return { root, options, manifest, write };
}

test('HTML inspection handles entities and avoids apparent links inside script text', () => {
  const result = inspectHtml('<div id="a&amp;b"></div><a href="/guide/?a=1&amp;b=2#x">Read</a><script>const x = \'<a href="/missing/">\';</script>');
  assert.ok(result.ids.has('a&b'));
  assert.deepEqual(result.references, [{ attribute: 'href', value: '/guide/?a=1&b=2#x' }]);
});

test('production links support relative routes, encoded anchors, queries, and image candidates', t => {
  const { options, write } = fixture(t);
  write('dist/index.html', '<a href="/guide/?search=x#a%26b">Read</a><img src="/image.svg" srcset="/image.svg 1x, /image-2.svg 2x">');
  write('dist/guide/index.html', '<h2 id="a&amp;b">Topic</h2><a href="../">Home</a>');
  write('dist/image.svg', '<svg/>'); write('dist/image-2.svg', '<svg/>');
  assert.deepEqual(checkSite(options).errors, []);
});

test('broken routes, assets, and anchors are diagnosed independently', t => {
  const { options, write } = fixture(t);
  write('dist/index.html', '<a href="/missing/">Missing</a><a href="/guide/#absent">Anchor</a><img src="/missing.svg">');
  write('dist/guide/index.html', '<h1 id="exists">Guide</h1>');
  const errors = checkSite(options).errors;
  assert.equal(errors.length, 3);
  assert.ok(errors.some(error => error.includes('missing anchor #absent')));
  assert.ok(errors.some(error => error.includes('/missing.svg')));
});

test('manifest rejects moving revisions and calendar-invalid review dates', () => {
  const errors = validateManifest({ sample: { name: 'Sample', origin: 'https://github.com/example/sample', commit: 'main', reviewed: '2026-02-31' } });
  assert.equal(errors.length, 2);
  assert.ok(errors.some(error => error.includes('full lowercase SHA')));
  assert.ok(errors.some(error => error.includes('valid YYYY-MM-DD')));
});

test('optional local checkouts are explicitly unverified; required source checking fails', t => {
  const { options, manifest, write } = fixture(t);
  write('dist/index.html', `<a href="${manifest.sample.origin}/blob/${manifest.sample.commit}/README.md">Source</a>`);
  const optional = checkSite(options);
  assert.equal(optional.errors.length, 0);
  assert.equal(optional.warnings.length, 1);
  const required = checkSite({ ...options, requireSources: true });
  assert.equal(required.errors.length, 1);
  assert.equal(required.warnings.length, 0);
});

test('source references and evidence are checked at the pinned revision, including line bounds', t => {
  const { options, root, manifest, write } = fixture(t);
  const repository = path.join(root, 'repositories/sample');
  write('repositories/sample/README.md', 'first\nsecond\n');
  const git = args => execFileSync('git', ['-C', repository, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git(['init']); git(['add', 'README.md']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture']);
  manifest.sample.commit = git(['rev-parse', 'HEAD']).trim();
  write('sources.json', JSON.stringify(manifest));
  const prefix = `${manifest.sample.origin}/blob/${manifest.sample.commit}/`;
  write('dist/index.html', `<a href="${prefix}README.md#L1-L2">Valid</a>`);
  write('research/evidence.json', JSON.stringify([{ id: 'sample-readme', claim: 'Fixture source exists', project: 'sample', path: 'README.md' }]));
  assert.deepEqual(checkSite({ ...options, requireSources: true }).errors, []);
  write('dist/index.html', `<a href="${prefix}README.md#L3">Bad line</a><a href="${prefix}absent.py">Missing source</a><a href="${manifest.sample.origin}/blob/main/README.md">Moving</a>`);
  write('research/evidence.json', JSON.stringify([{ id: 'missing-source', claim: 'This source is absent', project: 'sample', path: 'absent.md' }]));
  const errors = checkSite(options).errors;
  assert.equal(errors.length, 4);
  assert.ok(errors.some(error => error.includes('line anchor outside file')));
  assert.ok(errors.some(error => error.includes('not pinned')));
  assert.ok(errors.some(error => error.includes('absent.md')));
});

test('external checker retries unsupported HEAD and keeps rate limits unresolved', async () => {
  const methods = [];
  const result = await checkExternalLink('https://example.invalid/source', async (_url, options) => {
    methods.push(options.method);
    return new Response('', { status: options.method === 'HEAD' ? 405 : 200 });
  });
  assert.equal(result.result, 'valid');
  assert.deepEqual(methods, ['HEAD', 'GET']);
  assert.equal(classifyStatus(404), 'broken');
  assert.equal(classifyStatus(410), 'broken');
  assert.equal(classifyStatus(403), 'unresolved');
  assert.equal(classifyStatus(429), 'unresolved');
  assert.equal(classifyStatus(503), 'unresolved');
  const unavailable = await checkExternalLink('https://example.invalid/source', async () => { throw new TypeError('network unavailable'); });
  assert.equal(unavailable.result, 'unresolved');
});
