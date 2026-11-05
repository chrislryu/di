import test from 'node:test';
import assert from 'node:assert/strict';
import { sitePath, rewriteHtmlBase } from '../src/lib/site-paths.ts';
import { inspectHtml } from './check-content.mjs';

test('project paths retain fragments and queries without double prefixes or external rewrites', () => {
  assert.equal(sitePath('/start/#system-map', '/di/'), '/di/start/#system-map');
  assert.equal(sitePath('/?q=KV', '/di'), '/di/?q=KV');
  assert.equal(sitePath('/di/start/', '/di'), '/di/start/');
  assert.equal(sitePath('/diagram/', '/di'), '/di/diagram/');
  for (const value of ['#top', 'relative/', 'https://github.com/example/repo', '//cdn.example/file', 'mailto:a@example.com']) {
    assert.equal(sitePath(value, '/di'), value);
  }
  assert.equal(sitePath('/start/', '/'), '/start/');
});

test('HTML prefixes authored, SVG and template links while preserving code and scripts', () => {
  const html = '<!doctype html><a href="/start/#map">Start</a><script src="/di/_astro/site.js"></script>' +
    '<svg><a href="/architecture/vllm/">Engine</a><use href="#arrow"/></svg>' +
    '<template><a href="/concepts/">Concepts</a></template><img src="/favicon.svg">' +
    '<code>&lt;a href="/sample/"&gt;</code><script>const example = "/sample/";</script>';
  const result = rewriteHtmlBase(html, '/di');
  assert.deepEqual(inspectHtml(result).references.map(ref => ref.value), [
    '/di/start/#map', '/di/_astro/site.js', '/di/architecture/vllm/', '#arrow', '/di/concepts/', '/di/favicon.svg',
  ]);
  assert(result.includes('&lt;a href="/sample/"&gt;'));
  assert(result.includes('const example = "/sample/";'));
  assert.equal(rewriteHtmlBase(result, '/di'), result);
  assert.equal(rewriteHtmlBase(html, '/'), html);
});
