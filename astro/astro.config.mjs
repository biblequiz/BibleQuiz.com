// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';

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
			sidebar: [],
			customCss: [
			  // Relative path to your custom CSS file
			  './src/styles/custom.css',
			],
			components: {
				Header: './src/components/Header.astro',
				Footer: './src/components/Footer.astro',
			},
			lastUpdated: true,
			pagination: true,
		}),
	],
	output: 'static',
	build: {
		format: 'directory',
		assets: '_astro',
	},
});