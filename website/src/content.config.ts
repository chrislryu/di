import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro/zod';
import sources from './data/sources.json';

const project = z.enum(Object.keys(sources) as [keyof typeof sources, ...(keyof typeof sources)[]]);
const pageLink = z.object({
    title: z.string().min(1),
    href: z.string().regex(/^\/(?!\/)/, 'Use a site-relative route beginning with /'),
});
const schema = docsSchema({ extend: z.object({
    kind: z.enum(['index', 'start', 'concept', 'architecture', 'walkthrough', 'decision', 'glossary']).default('index'),
    projects: z.array(project).default([]),
    prerequisites: z.array(pageLink).default([]),
    related: z.array(pageLink).default([]),
}) });

export const collections = {
    docs: defineCollection({
        loader: docsLoader(),
        schema: context => schema(context).superRefine((data, ctx) => {
            if (data.kind === 'architecture' && data.projects.length !== 1)
                ctx.addIssue({ code: 'custom', path: ['projects'], message: 'An architecture guide needs one canonical project.' });
            if (data.kind === 'walkthrough' && data.projects.length === 0)
                ctx.addIssue({ code: 'custom', path: ['projects'], message: 'Record every participating source project.' });
        }),
    }),
};
