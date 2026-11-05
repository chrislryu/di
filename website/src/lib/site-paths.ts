import { parse, serialize } from 'parse5';

export function normalizeBase(base = '/') {
  const path = base.replace(/^\/+|\/+$/g, '');
  return path ? '/' + path : '';
}

/** Keep authored site-root URLs usable both locally and on a project site. */
export function sitePath(value: string, base = '/') {
  const prefix = normalizeBase(base);
  if (!prefix || !value.startsWith('/') || value.startsWith('//')) return value;
  if (value === prefix || ['/', '?', '#'].some(end => value.startsWith(prefix + end))) return value;
  return prefix + value;
}

interface HtmlNode {
  nodeName: string;
  attrs?: { name: string; value: string }[];
  childNodes?: HtmlNode[];
  content?: HtmlNode;
}

/** Parse real attributes so code samples, inline scripts and fragment IDs stay intact. */
export function rewriteHtmlBase(html: string, base = '/') {
  if (!normalizeBase(base)) return html;
  const document = parse(html);
  const visit = (node: HtmlNode) => {
    for (const attr of node.attrs ?? []) {
      if (['href', 'src', 'poster', 'action'].includes(attr.name)) attr.value = sitePath(attr.value, base);
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(document);
  return serialize(document);
}
