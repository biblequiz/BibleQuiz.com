import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { blogSchema } from 'starlight-blog/schema'

export const collections = {
	docs: defineCollection(
		{
			loader: docsLoader(),
			schema: docsSchema({
				extend: (context) => blogSchema(context)

					// Add custom properties to the docs frontmatter schema.
					.extend({
						eventId: z.string().optional(),
						eventType: z.enum(['jbq', 'tbq']).optional(),
						eventDates: z.string().optional(),
						eventScope: z.enum(['district', 'region', 'nation']).optional(),
						eventScopeLabel: z.string().optional(),
						eventLocation: z.string().optional(),
						eventIsLoaded: z.boolean().optional(),
						showSeasonButtons: z.boolean().optional(),
						hidePageTitle: z.boolean().optional(),
						hidePageTitleOnPrint: z.boolean().optional(),
						hideAdsOnPrint: z.boolean().optional(),
						hideFooterOnPrint: z.boolean().optional(),
						resource: z.object({
							programs: z.array(z.enum(['jbq', 'tbq', 'shared'])).min(1),
							audiences: z.array(z.enum([
								'quizzer',
								'parent',
								'coach',
								'event-coordinator',
							])).default([]),
							topics: z.array(z.enum([
								'apps',
								'forms',
								'graphics',
								'history',
								'learn',
								'questions',
								'rules',
								'scoresheets',
								'tools',
							])).min(1),
							format: z.enum(['app', 'page', 'pdf', 'video', 'xls', 'zip']),
							href: z.string().optional(),
							season: z.number().int().optional(),
							current: z.boolean().default(false),
							featured: z.boolean().default(false),
							label: z.string().optional(),
							actionLabel: z.string().optional(),
							order: z.number().optional(),
						}).optional(),
					}),
			})
		})
};