import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { parse } from 'parse5';
import { normalizeBase, sitePath } from '../src/lib/site-paths.ts';

const websiteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localOrigin = 'https://field-guide.invalid';

export function walkFiles(directory, suffix) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(filename, suffix) : filename.endsWith(suffix) ? [filename] : [];
  });
}

/** Parse HTML rather than treating script contents or escaped markup as links. */
export function inspectHtml(html) {
  const ids = new Set();
  const references = [];
  const visit = node => {
    const attrs = Object.fromEntries((node.attrs ?? []).map(attr => [attr.name, attr.value]));
    if (attrs.id) ids.add(attrs.id);
    if (node.tagName === 'a' && attrs.name) ids.add(attrs.name);
    for (const attribute of ['href', 'src', 'poster']) {
      if (attrs[attribute]) references.push({ value: attrs[attribute], attribute });
    }
    // Static Astro image sets contain ordinary URLs. Data URLs have commas
    // inside their payload and are self-contained, so need no filesystem check.
    if (attrs.srcset && !attrs.srcset.trim().startsWith('data:')) {
      for (const candidate of attrs.srcset.split(',')) {
        const value = candidate.trim().split(/\s+/)[0];
        if (value) references.push({ value, attribute: 'srcset' });
      }
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(parse(html));
  return { ids, references };
}

export function validateManifest(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) || !Object.keys(manifest).length) {
    return ['Source manifest must be a nonempty object keyed by project ID.'];
  }
  for (const [id, source] of Object.entries(manifest)) {
    if (!/^[a-z0-9-]+$/.test(id)) errors.push(`Invalid project ID: ${id}`);
    if (!source || typeof source !== 'object') { errors.push(`${id}: missing source metadata`); continue; }
    if (typeof source.name !== 'string' || !source.name.trim()) errors.push(`${id}: missing project name`);
    if (typeof source.origin !== 'string' || !/^https:\/\/github\.com\/[^/?#\s]+\/[^/?#\s]+$/.test(source.origin) || source.origin.endsWith('.git')) errors.push(`${id}: origin must be a canonical GitHub repository URL`);
    if (typeof source.commit !== 'string' || !/^[a-f0-9]{40}$/.test(source.commit)) errors.push(`${id}: commit must be a full lowercase SHA`);
    if (typeof source.reviewed !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(source.reviewed) || !Number.isFinite(Date.parse(source.reviewed)) || new Date(source.reviewed).toISOString().slice(0, 10) !== source.reviewed) errors.push(`${id}: reviewed must be a valid YYYY-MM-DD date`);
  }
  return errors;
}

export function resolveReference(value, route) {
  let url;
  try { url = new URL(value, new URL(route, localOrigin)); }
  catch { return { error: `Invalid URL: ${value}` }; }
  if (url.origin !== localOrigin) return { external: url };
  try {
    return {
      pathname: decodeURIComponent(url.pathname),
      fragment: decodeURIComponent(url.hash.slice(1)).split(':~:text=')[0],
    };
  } catch { return { error: `Invalid URL encoding: ${value}` }; }
}

export function sourceReference(value, manifest) {
  let url;
  try { url = new URL(value); } catch { return undefined; }
  if (url.hostname !== 'github.com' || !/^\/[^/]+\/[^/]+\/blob\//.test(url.pathname)) return undefined;
  const [, owner, repository, , commit, ...segments] = url.pathname.split('/');
  const origin = `https://github.com/${owner}/${repository}`;
  const entry = Object.entries(manifest).find(([, source]) => source.origin === origin);
  if (!entry) return { error: `Source link references unregistered repository: ${origin}` };
  const [project, source] = entry;
  if (!/^[a-f0-9]{40}$/.test(commit) || commit !== source.commit) return { error: `${project}: source link is not pinned to manifest commit: ${value}` };
  let file;
  try { file = decodeURIComponent(segments.join('/')); } catch { return { error: `Invalid source path encoding: ${value}` }; }
  if (!file || file.startsWith('/') || file.split('/').some(part => part === '..' || part === '.')) return { error: `Invalid repository-relative source path: ${value}` };
  return { project, path: file, fragment: url.hash.slice(1) };
}

export function checkSite({
  dist = path.join(websiteRoot, 'dist'),
  sourceManifest = path.join(websiteRoot, 'src/data/sources.json'),
  repositoryRoot = path.resolve(websiteRoot, '../references'),
  researchDir = path.join(websiteRoot, 'research'),
  requireSources = false,
  base = '/',
} = {}) {
  const errors = [], warnings = [];
  let manifest;
  try { manifest = JSON.parse(fs.readFileSync(sourceManifest, 'utf8')); }
  catch (error) { return { errors: [`Cannot read source manifest: ${error.message}`], warnings, counts: {} }; }
  errors.push(...validateManifest(manifest));
  if (errors.length) return { errors, warnings, counts: {} };

  const htmlFiles = walkFiles(dist, '.html');
  if (!htmlFiles.length) errors.push(`No built HTML found in ${dist}. Run npm run build first.`);
  const documents = new Map();
  for (const filename of htmlFiles) documents.set(path.resolve(filename), inspectHtml(fs.readFileSync(filename, 'utf8')));
  const missingProjects = new Set();
  const sourceChecks = new Map();
  let internalLinks = 0, sourceLinks = 0, evidenceRecords = 0;

  if (requireSources) {
    for (const project of Object.keys(manifest)) {
      if (!fs.existsSync(path.join(repositoryRoot, project, '.git'))) {
        missingProjects.add(project);
        errors.push(`${project}: local checkout unavailable; pinned source files were not checked`);
      }
    }
  }

  function checkSource(project, file, context, fragment = '') {
    const source = manifest[project];
    if (!source) { errors.push(`${context}: unknown source project ${project}`); return; }
    if (typeof file !== 'string' || !file || file.startsWith('/') || file.split('/').some(part => ['..', '.'].includes(part))) { errors.push(`${context}: invalid source file path`); return; }
    const checkout = path.join(repositoryRoot, project);
    if (!fs.existsSync(path.join(checkout, '.git'))) {
      if (!missingProjects.has(project)) {
        missingProjects.add(project);
        (requireSources ? errors : warnings).push(`${project}: local checkout unavailable; pinned source files were not checked`);
      }
      return;
    }
    const key = `${project}:${file}`;
    if (!sourceChecks.has(key)) {
      const result = spawnSync('git', ['-C', checkout, 'cat-file', '-t', `${source.commit}:${file}`], { encoding: 'utf8' });
      sourceChecks.set(key, result.status === 0 && result.stdout.trim() === 'blob');
    }
    if (!sourceChecks.get(key)) { errors.push(`${context}: file missing at inspected commit: ${key}`); return; }
    const lines = fragment.match(/^L(\d+)(?:-L(\d+))?$/);
    if (lines) {
      const first = Number(lines[1]), last = Number(lines[2] ?? lines[1]);
      const result = spawnSync('git', ['-C', checkout, 'show', `${source.commit}:${file}`], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
      const count = result.status === 0 ? result.stdout.split('\n').length - (result.stdout.endsWith('\n') ? 1 : 0) : 0;
      if (first < 1 || last < first || last > count) errors.push(`${context}: source line anchor outside file: ${key}#${fragment}`);
    }
  }

  for (const [filename, document] of documents) {
    let route = '/' + path.relative(dist, filename).split(path.sep).join('/');
    if (route.endsWith('/index.html')) route = route.slice(0, -'index.html'.length);
    route = sitePath(route, base);
    for (const reference of document.references) {
      const context = `${route} ${reference.attribute}=${reference.value}`;
      const resolved = resolveReference(reference.value, route);
      if (resolved.error) { errors.push(`${context}: ${resolved.error}`); continue; }
      if (resolved.external) {
        const source = sourceReference(resolved.external.href, manifest);
        if (source?.error) errors.push(`${context}: ${source.error}`);
        else if (source) { sourceLinks++; checkSource(source.project, source.path, context, source.fragment); }
        continue;
      }
      internalLinks++;
      const prefix = normalizeBase(base);
      if (prefix && resolved.pathname !== prefix && !resolved.pathname.startsWith(prefix + '/')) {
        errors.push(`${context}: internal URL escapes deployment base ${prefix}`); continue;
      }
      const pathname = prefix ? resolved.pathname.slice(prefix.length) || '/' : resolved.pathname;
      const candidate = path.resolve(dist, '.' + pathname);
      if (!candidate.startsWith(path.resolve(dist) + path.sep) && candidate !== path.resolve(dist)) { errors.push(`${context}: path leaves build directory`); continue; }
      const target = [candidate, path.join(candidate, 'index.html')].find(file => fs.existsSync(file) && fs.statSync(file).isFile());
      if (!target) { errors.push(`${context}: missing local route or asset`); continue; }
      if (resolved.fragment && target.endsWith('.html') && !documents.get(target)?.ids.has(resolved.fragment)) errors.push(`${context}: missing anchor #${resolved.fragment}`);
    }
  }

  for (const filename of walkFiles(researchDir, '.json')) {
    let records;
    try { records = JSON.parse(fs.readFileSync(filename, 'utf8')); }
    catch (error) { errors.push(`${filename}: invalid evidence JSON: ${error.message}`); continue; }
    if (!Array.isArray(records)) { errors.push(`${filename}: evidence must be an array`); continue; }
    const ids = new Set();
    for (const item of records) {
      evidenceRecords++;
      const context = `${path.basename(filename)}:${item?.id ?? 'missing ID'}`;
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id || typeof item.claim !== 'string' || !item.claim.trim()) { errors.push(`${context}: evidence needs an ID and claim`); continue; }
      if (ids.has(item.id)) errors.push(`${context}: duplicate evidence ID within file`);
      ids.add(item.id);
      checkSource(item.project, item.path, context);
    }
  }
  return { errors: [...new Set(errors)], warnings, counts: { pages: htmlFiles.length, internalLinks, sourceLinks, evidenceRecords, inspectedSourceFiles: sourceChecks.size } };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const unknown = args.filter(arg => arg !== '--require-sources');
  if (unknown.length) { console.error(`Unknown options: ${unknown.join(', ')}`); process.exitCode = 1; }
  else {
    const result = checkSite({ requireSources: args.includes('--require-sources'),
      base: process.env.GUIDE_BASE_PATH ?? '/',
      dist: path.resolve(websiteRoot, process.env.GUIDE_DIST ?? 'dist'),
    });
    console.log('Content check:', Object.entries(result.counts).map(([key, value]) => `${value} ${key}`).join(', '));
    for (const warning of result.warnings) console.warn(`UNVERIFIED ${warning}`);
    for (const error of result.errors) console.error(`ERROR ${error}`);
    console.log(`${result.errors.length} errors; ${result.warnings.length} unverified source checkouts.`);
    process.exitCode = result.errors.length ? 1 : 0;
  }
}
