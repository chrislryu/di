import registry from './guides.json';
import sources from './sources.json';

export type ProjectId = keyof typeof registry;
export interface Chapter { slug: string; title: string; summary: string; }
export const guides: Record<ProjectId, { chapters: Chapter[] }> = registry;
export const chapterHref = (project: string, slug = '') => `/architecture/${project}/${slug ? slug + '/' : ''}`;

export async function isGuidePublished(project: ProjectId) {
  const { getCollection } = await import('astro:content');
  const pages = await getCollection('docs');
  const published = new Set(pages.filter(page => !page.data.draft).map(page => page.id));
  return guides[project].chapters.every(chapter => published.has(`architecture/${project}/${chapter.slug}`));
}

export function guideContext(id: string) {
  const [, project, slug = ''] = id.split('/');
  if (!id.startsWith('architecture/') || !(project in guides)) return undefined;
  const projectId = project as ProjectId;
  const chapters = guides[projectId].chapters;
  const position = slug ? chapters.findIndex(chapter => chapter.slug === slug) + 1 : 0;
  if (slug && position === 0) return undefined;
  return { project: projectId, name: sources[projectId].name, chapters, position, total: chapters.length + 1,
    overviewHref: chapterHref(projectId),
    previous: position > 0 ? position === 1
      ? { href: chapterHref(projectId), title: `${sources[projectId].name}: Overview` }
      : { href: chapterHref(projectId, chapters[position - 2].slug), title: chapters[position - 2].title } : undefined,
    next: position < chapters.length
      ? { href: chapterHref(projectId, chapters[position].slug), title: chapters[position].title } : undefined,
  };
}
