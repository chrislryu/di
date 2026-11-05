import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkGuides, frontmatter, validateChapterHtml, validateGuideRegistry, validateOverviewHtml } from './check-guides.mjs';

const chapters = [
  { slug: 'startup', title: 'Startup', summary: 'Explain how the engine starts.' },
  { slug: 'memory', title: 'Memory', summary: 'Follow allocation ownership.' },
];
const sources = { sample: { name: 'Sample' } };
const registry = { sample: { chapters } };
const overviewFrame = ['why-it-exists', 'where-it-fits', 'architecture-overview', 'follow-an-operation', 'decision-gates', 'explore-the-code'].map(id => `<h2 id="${id}">${id}</h2>`).join('') + '<nav aria-label="Newcomer learning path"><a href="/start/">Start here</a></nav>';
function chapterHtml(index, overrides = {}) {
  const overview = '/architecture/sample/';
  const previous = overrides.previous ?? (index ? `${overview}${chapters[index - 1].slug}/` : overview);
  const next = index + 1 < chapters.length ? `<a rel="next" href="${overrides.next ?? `${overview}${chapters[index + 1].slug}/`}">Next</a>` : '';
  return `<nav aria-label="Breadcrumb"><a href="${overview}">Sample</a></nav>
    <p>Chapter ${index + 2} of 3</p><nav aria-label="Repository chapters">
    <a href="${overview}">Overview</a><a rel="prev" href="${previous}">Previous</a>${next}</nav>`;
}
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-chapters-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const options = { registryPath: path.join(root, 'guides.json'), sourcesPath: path.join(root, 'sources.json'), contentRoot: path.join(root, 'content'), dist: path.join(root, 'dist'), expectedChapters: 2 };
  const write = (filename, text) => { const target = path.join(root, filename); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text); };
  write('guides.json', JSON.stringify(registry)); write('sources.json', JSON.stringify(sources));
  const metadata = title => `---\ntitle: "Sample: ${title}"\nkind: architecture\nprojects: [sample]\n---\n\nContent.\n`;
  write('content/sample.mdx', metadata('Overview'));
  for (const [index, chapter] of chapters.entries()) {
    write(`content/sample/${chapter.slug}.mdx`, metadata(chapter.title));
    write(`dist/architecture/sample/${chapter.slug}/index.html`, chapterHtml(index));
  }
  write('dist/architecture/sample/index.html', overviewFrame + `<ol data-guide-chapters="sample">${chapters.map(chapter => `<li><a href="/architecture/sample/${chapter.slug}/">${chapter.title}</a></li>`).join('')}</ol>`);
  return { root, options, write, metadata };
}

test('registry rejects missing projects, duplicate or unsafe routes, and missing outcomes', () => {
  const errors = validateGuideRegistry({ sample: { chapters: [{slug:'../bad',title:'X',summary:''},{slug:'../bad',title:'',summary:'Y'}] }, unknown: { chapters: [] } }, { ...sources, absent: { name: 'Absent' } }, 2);
  assert(errors.some(error => error.includes('absent: missing')));
  assert(errors.some(error => error.includes('unknown source')));
  assert(errors.some(error => error.includes('kebab-case')));
  assert(errors.some(error => error.includes('duplicate chapter slug')));
  assert(errors.some(error => error.includes('missing title')));
  assert(errors.some(error => error.includes('missing summary')));
});

test('frontmatter uses YAML semantics for quoted titles, comments, and project lists', () => {
  const data = frontmatter('---\ntitle: "Sample: allocation & release"\nkind: architecture # comment\nprojects:\n  - sample\n---\nBody');
  assert.deepEqual(data.projects, ['sample']); assert.equal(data.kind, 'architecture');
  assert.equal(data.title, 'Sample: allocation & release');
  assert.throws(() => frontmatter('No metadata'), /Missing YAML/);
});

test('chapter navigation crosses to overview at the first chapter and stops at the last', () => {
  for (const index of [0, 1]) assert.deepEqual(validateChapterHtml(chapterHtml(index), {project:'sample',index,chapters}), []);
  const errors = validateChapterHtml(chapterHtml(0, {next:'/architecture/other/'}), {project:'sample',index:0,chapters});
  assert(errors.some(error => error.includes('next chapter must be /architecture/sample/memory/')));
  const last = chapterHtml(1).replace('</nav>', '</nav><nav aria-label="Newcomer learning path"></nav>');
  assert(validateChapterHtml(last, {project:'sample',index:1,chapters}).some(error => error.includes('global newcomer path')));
});

test('chapter progress, breadcrumb parent, and return link are independent obligations', () => {
  const errors = validateChapterHtml('<p>Chapter 1 of 3</p><nav aria-label="Repository chapters"></nav>', {project:'sample',index:0,chapters});
  assert(errors.some(error => error.includes('missing chapter progress')));
  assert(errors.some(error => error.includes('breadcrumb')));
  assert(errors.some(error => error.includes('return-to-overview')));
});

test('overview lists chapters once in curriculum order', () => {
  assert.deepEqual(validateOverviewHtml(overviewFrame + '<div data-guide-chapters="sample"><a href="/architecture/sample/startup/">Start</a><a href="/architecture/sample/memory/">Memory</a></div>', {project:'sample',chapters}), []);
  const wrong = validateOverviewHtml('<div data-guide-chapters="sample"><a href="/architecture/sample/memory/">Memory</a><a href="/architecture/sample/startup/">Start</a></div>', {project:'sample',chapters});
  assert(wrong.some(error => error.includes('registry order')));
});

test('overview migration preserves public anchors and global learning-path access', () => {
  const html = overviewFrame.replace('id="where-it-fits"', 'id="renamed-section"').replace('aria-label="Newcomer learning path"', 'aria-label="Other navigation"') + '<div data-guide-chapters="sample"><a href="/architecture/sample/startup/">Start</a><a href="/architecture/sample/memory/">Memory</a></div>';
  const errors = validateOverviewHtml(html, {project:'sample',chapters});
  assert(errors.some(error => error.includes('preserved overview anchor #where-it-fits')));
  assert(errors.some(error => error.includes('global newcomer navigation')));
});

test('complete fixture validates authored metadata, overview, and built chapter boundaries', t => {
  const { options } = fixture(t);
  const result = checkGuides(options);
  assert.deepEqual(result.errors, []); assert.equal(result.counts.completeGuides, 1);
  assert.equal(result.counts.authoredChapters, 2); assert.equal(result.counts.builtChapters, 2);
});

test('incomplete mode reports absent authoring while strict release validation fails', t => {
  const { root, options } = fixture(t);
  fs.unlinkSync(path.join(root, 'content/sample/memory.mdx'));
  assert(checkGuides(options).errors.some(error => error.includes('expected one authored chapter')));
  const partial = checkGuides({...options,allowIncomplete:true});
  assert.deepEqual(partial.errors, []); assert.equal(partial.warnings.length, 1);
  assert.equal(partial.counts.completeGuides, 0);
});

test('wrong project metadata, ambiguous overviews, drafts, and orphan pages fail validation', t => {
  const { options, write, metadata } = fixture(t);
  write('content/sample/startup.mdx', '---\ntitle: Startup\nkind: concept\nprojects: [other]\n---\nBody');
  write('content/sample/memory.mdx', metadata('Memory').replace('kind: architecture','kind: architecture\ndraft: true'));
  write('content/sample/index.mdx', metadata('Duplicate overview'));
  write('content/sample/unregistered.mdx', metadata('Orphan'));
  const errors = checkGuides(options).errors;
  for (const expected of ['canonical overview','kind must','only project','title must include','still a draft','orphan']) assert(errors.some(error => error.includes(expected)), expected);
});
