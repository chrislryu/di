// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import { existsSync, readFileSync } from 'node:fs';
import guides from './src/data/guides.json' with { type: 'json' };
import sources from './src/data/sources.json' with { type: 'json' };

/** Only completed chapter sets enter navigation during authoring.
 * @param {keyof typeof guides} id
 */
function repositoryGuide(id) {
  const chapters = guides[id].chapters;
  const complete = chapters.every(chapter => {
    const file = new URL('./src/content/docs/architecture/' + id + '/' + chapter.slug + '.mdx', import.meta.url);
    return existsSync(file) && !/^draft:\s*true\s*$/m.test(readFileSync(file, 'utf8'));
  });
  return complete ? { label: sources[id].name, collapsed: true, items: [
    { label: '1. Overview', slug: 'architecture/' + id },
    ...chapters.map((chapter, index) => ({ label: (index + 2) + '. ' + chapter.title.replace(sources[id].name + ': ', ''), slug: 'architecture/' + id + '/' + chapter.slug })),
  ] } : { label: sources[id].name, slug: 'architecture/' + id };
}
export default defineConfig({
  site: process.env.GUIDE_SITE_URL ?? 'https://chrislryu.github.io',
  base: process.env.GUIDE_BASE_PATH ?? '/',
  outDir: process.env.GUIDE_DIST ?? './dist',
  integrations: [
    mermaid({ autoTheme: true, enableLog: false, mermaidConfig: {
      flowchart: { useMaxWidth: false },
      sequence: { useMaxWidth: false },
      state: { useMaxWidth: false },
    } }),
    starlight({
      title: 'Distributed Inference Field Guide',
      description: "LLM serving, GPU communication, and networking—from architecture to source code.",
      customCss: ['./src/styles/guide.css'],
      components: { PageTitle: './src/components/GuideTitle.astro', Pagination: './src/components/GuidePagination.astro' },
      sidebar: [
        { label:'Start here', items:[{label:'Customer problem & system map',slug:'start'},{label:'Reading path',slug:'start/reading-path'}] },
        { label:'Core concepts', items:[{autogenerate:{directory:'concepts'}}], collapsed:true },
        { label:'Architecture guides', items:[
          {label:'Project index',slug:'architecture'},
          {label:'Serving orchestration',items:[repositoryGuide('dynamo')]},
          {label:'Inference engines',items:[repositoryGuide('vllm'),repositoryGuide('sglang'),repositoryGuide('deepinfer')]},
          {label:'Data movement and shared state',items:[repositoryGuide('nixl'),repositoryGuide('mooncake')]},
          {label:'GPU communication',items:[repositoryGuide('nccl'),repositoryGuide('deepep')]},
          {label:'Network integration',items:[repositoryGuide('aws-ofi-nccl'),repositoryGuide('libfabric')]},
        ] },
        { label:'End-to-end walkthroughs', items:[{autogenerate:{directory:'walkthroughs'}}], collapsed:true },
        { label:'Decision guides', items:[{autogenerate:{directory:'decisions'}}], collapsed:true },
        {label:'Glossary',slug:'glossary'},
      ],
    }),
  ],
});
