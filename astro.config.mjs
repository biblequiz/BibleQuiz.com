// astro.config.mjs
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import sitemap from "@astrojs/sitemap";
import path from "path";
import starlightBlog from "starlight-blog";
import starlightLinksValidator from "starlight-links-validator";

import tailwindcss from "@tailwindcss/vite";

import react from "@astrojs/react";

export default defineConfig({
    site: "https://biblequiz.com",
    integrations: [
        sitemap(),
        starlight({
            title: "BibleQuiz.com",
            description: "Home of AG Bible Quiz",
            social: [
                {
                    icon: "email",
                    label: "Email",
                    href: "mailto:hello@biblequiz.com",
                },
                {
                    icon: "facebook",
                    label: "Facebook",
                    href: "https://facebook.com/groups/agbiblequiz",
                },
                {
                    icon: "youtube",
                    label: "Youtube",
                    href: "https://youtube.com/@BibleQuiz-AG",
                },
            ],
            favicon: "/favicon.png",
            logo: {
                light: "./src/assets/images/light-logo.png",
                dark: "./src/assets/images/dark-logo.png",
                replacesTitle: true,
            },
            customCss: ["./src/styles/custom.css", "./src/styles/global.css"],
            sidebar: [
                {
                    label: "Upcoming & Live Events",
                    slug: "upcoming-events",
                },
                {
                    label: "Apps",
                    slug: "apps",
                },
                {
                    label: "Junior Bible Quiz (JBQ)",
                    collapsed: true,
                    autogenerate: { directory: "jbq" },
                },
                {
                    label: "Teen Bible Quiz (TBQ)",
                    collapsed: true,
                    autogenerate: { directory: "tbq" },
                },
                {
                    label: "Quizzer Search",
                    slug: "quizzer-search",
                },
                {
                    label: "Subscribe",
                    slug: "subscribe",
                },
            ],
            components: {
                Header: "./src/components/Header.astro",
                Footer: "./src/components/Footer.astro",
                PageFrame: "./src/components/PageFrame.astro",
                PageTitle: "./src/components/PageTitle.astro",
                Sidebar: "./src/components/sidebar/Sidebar.astro",
                TwoColumnContent: "./src/components/TwoColumnContent.astro",
                SocialIcons: "./src/components/SocialIcons.astro",
            },
            lastUpdated: true,
            pagefind: {
                ranking: {
                    termSimilarity: 0.6,
                },
            },
            pagination: false,
            plugins: [
                starlightLinksValidator({
                    errorOnRelativeLinks: false,
                }),
                starlightBlog({
                    title: "News",
                    prefix: "news",
                    postCount: 10,
                    recentPostCount: 10,
                }),
            ],
        }),
        react(),
    ],
    output: "static",
    build: {
        format: "directory",
        assets: "_astro",
    },
    vite: {
        resolve: {
            alias: {
                "@": path.resolve("./src"),
                "@assets": path.resolve("./src/assets"),
                "@components": path.resolve("./src/components"),
                "@data": path.resolve("./src/data"),
                "@layouts": path.resolve("./src/layouts"),
                "@pages": path.resolve("./src/pages"),
                "@types": path.resolve("./src/types"),
                "@utils": path.resolve("./src/utils"),
            },
        },

        plugins: [tailwindcss()],
    },
});
