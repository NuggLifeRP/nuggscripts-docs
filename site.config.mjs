// Single place for every identity value the site needs.
// Fill these in and everything else (URLs, edit links, social buttons, footer)
// follows automatically.

export const SITE = {
  title: 'NuggScripts',
  tagline: 'FiveM script documentation',
  description:
    'Official documentation for the NuggScripts FiveM resources — install guides, full config references, exports and troubleshooting.',

  // GitHub account that owns the docs repository.
  githubUser: 'NuggLifeRP',
  repo: 'nuggscripts-docs',
  branch: 'main',

  // Leave as null until the domain is bought and its DNS points here.
  // Set it to 'nuggscripts.com' and the site moves over with no other edits:
  // the site URL and the base path both follow from it. See the README.
  domain: 'nuggscripts.com',

  // Optional. Any left null simply hides its button.
  discord: 'https://discord.gg/x4yKq6UATV',
  store: null,
  youtube: null,
};

export const SITE_URL = SITE.domain
  ? `https://${SITE.domain}`
  : `https://${SITE.githubUser.toLowerCase()}.github.io`;

export const BASE_PATH = SITE.domain ? '/' : `/${SITE.repo}`;

export const EDIT_BASE = `https://github.com/${SITE.githubUser}/${SITE.repo}/edit/${SITE.branch}/`;
