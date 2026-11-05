import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseHtml } from 'parse5';
import { parse as parseYaml } from 'yaml';
import { sitePath } from '../src/lib/site-paths.ts';

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function validateGuideRegistry(registry, sources, expectedChapters = 14) {
  const errors = [];
  if (!registry || typeof registry !== 'object' || Array.isArray(registry)) return ['Guide registry must be an object keyed by project ID.'];
  for (const project of Object.keys(sources)) if (!registry[project]) errors.push(`${project}: missing guide registry entry`);
  for (const [project, guide] of Object.entries(registry)) {
    if (!sources[project]) errors.push(`${project}: unknown source project`);
    if (!guide || !Array.isArray(guide.chapters)) { errors.push(`${project}: chapters must be an array`); continue; }
    if (guide.chapters.length !== expectedChapters) errors.push(`${project}: expected ${expectedChapters} specialist chapters, found ${guide.chapters.length}`);
    const slugs = new Set();
    for (const chapter of guide.chapters) {
      if (!chapter || typeof chapter !== 'object') { errors.push(`${project}: invalid chapter record`); continue; }
      const context = `${project}/${chapter.slug ?? '(missing slug)'}`;
      if (typeof chapter.slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(chapter.slug) || chapter.slug === 'index') errors.push(`${context}: slug must be a nonempty kebab-case route suffix other than index`);
      if (slugs.has(chapter.slug)) errors.push(`${context}: duplicate chapter slug`);
      slugs.add(chapter.slug);
      for (const field of ['title', 'summary']) if (typeof chapter[field] !== 'string' || !chapter[field].trim()) errors.push(`${context}: missing ${field}`);
    }
  }
  return errors;
}

export function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('Missing YAML frontmatter');
  const data = parseYaml(match[1]);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Frontmatter must be an object');
  return data;
}

function descendants(node, predicate) {
  const result = [];
  const visit = current => {
    if (predicate(current)) result.push(current);
    for (const child of current.childNodes ?? []) visit(child);
  };
  visit(node); return result;
}
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join(' ');
const links = node => descendants(node, child => child.tagName === 'a').map(child => ({ href: attr(child, 'href'), rel: attr(child, 'rel') }));
const hasLink = (node, href) => links(node).some(link => link.href === href);

export function validateChapterHtml(html, { project, index, chapters, base = '/' }) {
  const errors = [], document = parseHtml(html);
  const context = `${project}/${chapters[index].slug}`;
  const overview = sitePath(`/architecture/${project}/`, base);
  const navigation = descendants(document, node => node.tagName === 'nav' && attr(node, 'aria-label') === 'Repository chapters')[0];
  if (!navigation) errors.push(`${context}: missing Repository chapters navigation`);
  else {
    const expectedPrevious = index === 0 ? overview : `${overview}${chapters[index - 1].slug}/`;
    const expectedNext = index + 1 < chapters.length ? `${overview}${chapters[index + 1].slug}/` : undefined;
    const actualPrevious = links(navigation).filter(link => link.rel?.split(/\s+/).includes('prev'));
    const actualNext = links(navigation).filter(link => link.rel?.split(/\s+/).includes('next'));
    if (actualPrevious.length !== 1 || actualPrevious[0].href !== expectedPrevious) errors.push(`${context}: previous chapter must be ${expectedPrevious}`);
    if (expectedNext ? actualNext.length !== 1 || actualNext[0].href !== expectedNext : actualNext.length !== 0) errors.push(`${context}: next chapter must be ${expectedNext ?? 'absent at the last chapter'}`);
    if (!hasLink(navigation, overview)) errors.push(`${context}: chapter navigation needs a return-to-overview link`);
  }
  if (!new RegExp(`Chapter\\s+${index + 2}\\s+of\\s+${chapters.length + 1}`, 'i').test(text(document))) errors.push(`${context}: missing chapter progress Chapter ${index + 2} of ${chapters.length + 1}`);
  const breadcrumb = descendants(document, node => node.tagName === 'nav' && attr(node, 'aria-label') === 'Breadcrumb')[0];
  if (!breadcrumb || !hasLink(breadcrumb, overview)) errors.push(`${context}: breadcrumb needs the repository overview`);
  if (descendants(document, node => node.tagName === 'nav' && attr(node, 'aria-label') === 'Newcomer learning path').length) errors.push(`${context}: chapter footer must not navigate the global newcomer path`);
  return errors;
}

export function validateOverviewHtml(html, { project, chapters, base = '/' }) {
  const document = parseHtml(html), errors = [];
  const ids = new Set(descendants(document, node => attr(node, 'id')).map(node => attr(node, 'id')));
  for (const anchor of ['why-it-exists', 'where-it-fits', 'architecture-overview', 'follow-an-operation', 'decision-gates', 'explore-the-code']) {
    if (!ids.has(anchor)) errors.push(`${project}: missing preserved overview anchor #${anchor}`);
  }
  const list = descendants(document, node => attr(node, 'data-guide-chapters') === project)[0];
  if (!list) errors.push(`${project}: overview needs data-guide-chapters="${project}"`);
  else {
    const expected = chapters.map(chapter => sitePath(`/architecture/${project}/${chapter.slug}/`, base));
    const actual = links(list).map(link => link.href);
    if (actual.length !== expected.length || actual.some((href, index) => href !== expected[index])) errors.push(`${project}: overview chapter list must contain every chapter once, in registry order`);
  }
  if (descendants(document, node => node.tagName === 'nav' && attr(node, 'aria-label') === 'Repository chapters').length) errors.push(`${project}: overview must retain global navigation rather than chapter previous/next links`);
  if (!descendants(document, node => node.tagName === 'nav' && attr(node, 'aria-label') === 'Newcomer learning path').length) errors.push(`${project}: overview needs the global newcomer navigation`);
  return errors;
}

function markdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? markdownFiles(path.join(directory, entry.name)) : /\.mdx?$/.test(entry.name) ? [path.join(directory, entry.name)] : []);
}

export function checkGuides({
  registryPath = path.join(websiteRoot, 'src/data/guides.json'),
  sourcesPath = path.join(websiteRoot, 'src/data/sources.json'),
  contentRoot = path.join(websiteRoot, 'src/content/docs/architecture'),
  dist = path.join(websiteRoot, 'dist'),
  allowIncomplete = false,
  expectedChapters = 14,
  base = '/',
} = {}) {
  const errors = [], warnings = [];
  let registry, sources;
  try { registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')); sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8')); }
  catch (error) { return { errors: [`Cannot read guide registry/source manifest: ${error.message}`], warnings, counts: {} }; }
  errors.push(...validateGuideRegistry(registry, sources, expectedChapters));
  if (errors.length) return { errors, warnings, counts: {} };
  const expectedFiles = new Set(), counts = { projects: Object.keys(registry).length, completeGuides: 0, authoredChapters: 0, builtChapters: 0 };
  const locate = candidates => candidates.filter(filename => fs.existsSync(filename));
  for (const [project, { chapters }] of Object.entries(registry)) {
    const overviewFiles = locate(['.mdx', '.md', '/index.mdx', '/index.md'].map(suffix => path.join(contentRoot, project + suffix)));
    if (overviewFiles.length !== 1) errors.push(`${project}: expected exactly one canonical overview, found ${overviewFiles.length}`);
    overviewFiles.forEach(filename => expectedFiles.add(filename));
    if (overviewFiles.length === 1) {
      try {
        const data = frontmatter(fs.readFileSync(overviewFiles[0], 'utf8'));
        if (data.kind !== 'architecture') errors.push(`${project}: overview kind must be architecture`);
        if (!Array.isArray(data.projects) || data.projects.length !== 1 || data.projects[0] !== project) errors.push(`${project}: overview metadata must identify only project ${project}`);
        if (data.draft === true) errors.push(`${project}: canonical overview must not be a draft`);
      } catch (error) { errors.push(`${project}: ${error.message}`); }
    }
    let complete = overviewFiles.length === 1;
    for (const [index, chapter] of chapters.entries()) {
      const candidates = ['.mdx', '.md'].map(extension => path.join(contentRoot, project, chapter.slug + extension));
      const files = locate(candidates);
      files.forEach(filename => expectedFiles.add(filename));
      if (files.length !== 1) {
        complete = false;
        (allowIncomplete && files.length === 0 ? warnings : errors).push(`${project}/${chapter.slug}: expected one authored chapter, found ${files.length}`);
        continue;
      }
      counts.authoredChapters++;
      let data;
      try { data = frontmatter(fs.readFileSync(files[0], 'utf8')); }
      catch (error) { errors.push(`${project}/${chapter.slug}: ${error.message}`); complete = false; continue; }
      if (data.kind !== 'architecture') errors.push(`${project}/${chapter.slug}: kind must be architecture`);
      if (!Array.isArray(data.projects) || data.projects.length !== 1 || data.projects[0] !== project) errors.push(`${project}/${chapter.slug}: metadata must identify only project ${project}`);
      if (typeof data.title !== 'string' || !data.title.toLowerCase().includes(sources[project].name.toLowerCase())) errors.push(`${project}/${chapter.slug}: title must include ${sources[project].name} for distinct search results`);
      if (data.draft === true) { complete = false; (allowIncomplete ? warnings : errors).push(`${project}/${chapter.slug}: registered chapter is still a draft`); continue; }
      const built = path.join(dist, 'architecture', project, chapter.slug, 'index.html');
      if (!fs.existsSync(built)) { complete = false; (allowIncomplete ? warnings : errors).push(`${project}/${chapter.slug}: built chapter missing; run the production build`); continue; }
      counts.builtChapters++;
      errors.push(...validateChapterHtml(fs.readFileSync(built, 'utf8'), { project, index, chapters, base }));
    }
    if (complete) {
      counts.completeGuides++;
      const overview = path.join(dist, 'architecture', project, 'index.html');
      if (!fs.existsSync(overview)) errors.push(`${project}: built overview missing`);
      else errors.push(...validateOverviewHtml(fs.readFileSync(overview, 'utf8'), { project, chapters, base }));
    }
  }
  for (const filename of markdownFiles(contentRoot)) {
    const relative = path.relative(contentRoot, filename);
    if (!/^index\.mdx?$/.test(relative) && !expectedFiles.has(filename)) errors.push(`${relative}: orphan or unexpected architecture page`);
  }
  return { errors, warnings, counts };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const unknown = process.argv.slice(2).filter(argument => argument !== '--allow-incomplete');
  if (unknown.length) { console.error(`Unknown options: ${unknown.join(', ')}`); process.exitCode = 1; }
  else {
    const result = checkGuides({ allowIncomplete: process.argv.includes('--allow-incomplete'),
      base: process.env.GUIDE_BASE_PATH ?? '/',
      dist: path.resolve(websiteRoot, process.env.GUIDE_DIST ?? 'dist'),
    });
    console.log('Guide check:', Object.entries(result.counts).map(([key, value]) => `${value} ${key}`).join(', '));
    if (result.warnings.length) console.warn(`INCOMPLETE ${result.warnings.length} chapter/build items are not ready.`);
    result.errors.forEach(error => console.error(`ERROR ${error}`));
    console.log(`${result.errors.length} errors; ${result.warnings.length} incomplete items.`);
    process.exitCode = result.errors.length ? 1 : 0;
  }
}
