import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { SITE, SITE_URL, BASE_PATH, EDIT_BASE } from './site.config.mjs';

const social = [
  { icon: 'github', label: 'GitHub', href: `https://github.com/${SITE.githubUser}` },
  SITE.discord && { icon: 'discord', label: 'Discord', href: SITE.discord },
  SITE.youtube && { icon: 'youtube', label: 'YouTube', href: SITE.youtube },
].filter(Boolean);

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'always',
  markdown: {
    shikiConfig: {
      // The docs are full of server.cfg blocks. Shiki has no "cfg" grammar, and
      // bash is the closest match for `ensure x` / `set y "z"` / # comments.
      langAlias: { cfg: 'bash' },
    },
  },
  integrations: [
    starlight({
      title: SITE.title,
      description: SITE.description,
      logo: {
        src: './src/assets/logo-mark.png',
        alt: 'NuggScripts',
      },
      favicon: '/favicon.png',
      social,
      editLink: { baseUrl: EDIT_BASE },
      customCss: ['./src/styles/custom.css'],
      lastUpdated: true,
      pagination: true,
      credits: false,
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 3 },
      head: [
        { tag: 'meta', attrs: { property: 'og:image', content: `${SITE_URL}${BASE_PATH === '/' ? '' : BASE_PATH}/og-default.jpg` } },
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#0b0710' } },
      ],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Welcome', link: '/' },
            { label: 'Before you install', link: '/start/before-you-install/' },
            { label: 'Downloading your purchase', link: '/start/downloading/' },
            { label: 'Common install mistakes', link: '/start/common-mistakes/' },
            { label: 'Getting support', link: '/start/support/' },
          ],
        },
        {
          label: 'nuggs_multicharacter',
          collapsed: false,
          items: [
            { label: 'Overview', link: '/nuggs-multicharacter/' },
            { label: 'Installation', link: '/nuggs-multicharacter/installation/' },
            { label: 'Frameworks', link: '/nuggs-multicharacter/frameworks/' },
            { label: 'Configuration', link: '/nuggs-multicharacter/configuration/' },
            { label: 'Arrival points', link: '/nuggs-multicharacter/arrival-points/' },
            { label: 'Clothing & tattoos', link: '/nuggs-multicharacter/clothing-and-tattoos/' },
            { label: 'The creator', link: '/nuggs-multicharacter/creator/' },
            { label: 'Outfits', link: '/nuggs-multicharacter/outfits/' },
            { label: 'Membership & slots', link: '/nuggs-multicharacter/membership/' },
            { label: 'Commands', link: '/nuggs-multicharacter/commands/' },
            { label: 'Theme & fonts', link: '/nuggs-multicharacter/theme/' },
            { label: 'Notes & limitations', link: '/nuggs-multicharacter/notes/' },
            {
              label: 'Config reference',
              collapsed: true,
              items: [{ autogenerate: { directory: 'nuggs-multicharacter/config' } }],
            },
            {
              label: 'Integration',
              collapsed: true,
              items: [{ autogenerate: { directory: 'nuggs-multicharacter/integration' } }],
            },
            { label: 'Troubleshooting', link: '/nuggs-multicharacter/troubleshooting/' },
            { label: 'Changelog', link: '/nuggs-multicharacter/changelog/' },
          ],
        },
      ],
    }),
  ],
});
