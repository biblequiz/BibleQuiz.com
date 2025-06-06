// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import path from 'path';
import starlightLinksValidator from 'starlight-links-validator'

export default defineConfig({
	site: 'https://biblequiz.com',
	integrations: [
		sitemap(),
		starlight({
			title: 'BibleQuiz.com',
			description: 'Home of AG Bible Quiz',
			social: [
				{ icon: 'email', label: 'Email', href: 'mailto:hello@biblequiz.com' },
				{ icon: 'facebook', label: 'Facebook', href: 'https://facebook.com/groups/agbiblequiz' },
				{ icon: 'youtube', label: 'Youtube', href: 'https://youtube.com/@BibleQuiz-AG' },
				{
				  icon: 'email',
				  label: 'foo',
				  href: '/login',
				}
			],
			favicon: '/favicon.png',
			logo: {
				light: './src/assets/images/light-logo.png',
				dark: './src/assets/images/dark-logo.png',
				replacesTitle: true,
			},
			customCss: [
			  // Relative path to your custom CSS file
			  './src/styles/custom.css',
			],
			components: {
				Header: './src/components/Header.astro',
				Footer: './src/components/Footer.astro',
				LinkCardWithSlot: './src/components/LinkCardWithSlot.astro',
			},
			lastUpdated: true,
			pagination: false,
			plugins: [starlightLinksValidator()],
		}),
	],
	output: 'static',
	build: {
		format: 'directory',
		assets: '_astro',
	},
	vite: {
	  resolve: {
		alias: {
		  '@': path.resolve('./src'),
		  '@assets': path.resolve('./src/assets'),
		  '@components': path.resolve('./src/components'),
		  '@layouts': path.resolve('./src/layouts'),
		  '@pages': path.resolve('./src/pages'),
		}
	  }
	}
});