// astro.config.mjs
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import path from 'path';
import starlightBlog from 'starlight-blog';
import starlightLinksValidator from 'starlight-links-validator'

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

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
        { icon: 'youtube', label: 'Youtube', href: 'https://youtube.com/@BibleQuiz-AG' }
      ],
      favicon: '/favicon.png',
      logo: {
        light: './src/assets/images/light-logo.png',
        dark: './src/assets/images/dark-logo.png',
        replacesTitle: true,
      },
      customCss: [
        './src/styles/custom.css',
        './src/styles/global.css',
      ],
      sidebar: [
        {
          label: 'Upcoming & Live Events',
          slug: 'upcoming-events'
        },
        {
          label: 'Apps',
          slug: 'apps'
        },
        {
          label: 'Junior Bible Quiz (JBQ)1',
          collapsed: true,
          autogenerate: { directory: 'jbq1' }
        },
        {
          label: 'Junior Bible Quiz (JBQ)2',
          collapsed: true,
          autogenerate: { directory: 'jbq2' }
        },
        {
          label: 'Teen Bible Quiz (TBQ)',
          collapsed: true,
          autogenerate: { directory: 'tbq' }
        },
        {
          label: 'Subscribe',
          slug: 'subscribe'
        },
      ],
      components: {
        Header: './src/components/Header.astro',
        Footer: './src/components/Footer.astro',
        Sidebar: './src/components/Sidebar.astro'
      },
      lastUpdated: true,
      pagination: false,
      plugins: [
        starlightLinksValidator({
          errorOnRelativeLinks: false
        }),
        starlightBlog({
          postCount: 10,
          recentPostCount: 10
        })],
    }),
    react()],
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
        '@data': path.resolve('./src/data'),
        '@layouts': path.resolve('./src/layouts'),
        '@pages': path.resolve('./src/pages'),
      }
    },

    plugins: [tailwindcss()]
  }
});