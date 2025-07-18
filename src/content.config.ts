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
						hidePageTitleOnPrint: z.boolean().optional(),
						hideFooterOnPrint: z.boolean().optional(),
					}),
			})
		})
};