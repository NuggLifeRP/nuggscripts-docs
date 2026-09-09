# NuggAssassin docs

The customer-facing documentation site for NuggAssassin FiveM scripts, built with
[Astro Starlight](https://starlight.astro.build) and deployed to GitHub Pages.

## How content works

**The script folders are the source of truth.** Each resource keeps its full
`README.md`, `CONFIG.md`, `INTEGRATION.md` and `CHANGELOG.md` so customers get
everything offline in the zip. This site does not duplicate them — it splits them
into navigable pages at sync time.

```
nuggs_multicharacter/README.md   ──┐
nuggs_multicharacter/CONFIG.md   ──┤
nuggs_multicharacter/INTEGRATION ──┼──  npm run sync  ──►  src/content/docs/
nuggs_multicharacter/CHANGELOG   ──┘                       (36 pages, generated)
```

`docs.sources.json` maps source sections onto site pages. `npm run sync` reads it
and writes `src/content/docs/<product>/`, rewriting cross-file links
(`CONFIG.md § 6`) into working site links along the way.

Anything under `src/content/docs/<product>/` is **generated — never edit it**.
Edit the markdown in the script folder and re-sync.

Hand-written pages live outside the product folders: `src/content/docs/index.mdx`
and `src/content/docs/start/`.

## Updating the docs

```bash
npm run sync     # pull the latest markdown from the script folders
npm run dev      # preview at http://localhost:4321/nuggscripts-docs/
```

Then commit and push. GitHub Actions builds and deploys on every push to `main`.

The sync step warns when a source file gains a section that no page claims:

```
! nuggs-multicharacter/README.md: section Vehicles is not on any page
```

That is the signal to add it to `docs.sources.json` — nothing is silently
dropped.

## Adding a script

1. Add an entry to `docs.sources.json`: the product slug, its folder path, and
   which sections of each markdown file become which page.
2. Add its sidebar group in `astro.config.mjs`.
3. Add its card to `src/content/docs/index.mdx`.
4. `npm run sync`, check the warnings are clean, commit.

## Commands

| | |
| --- | --- |
| `npm run sync` | Regenerate pages from the script folders |
| `npm run dev` | Local preview with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run check:links` | Verify every internal link and anchor in `dist/` |
| `node scripts/build-assets.mjs` | Rebuild the logo, favicon and social cards |

## Configuration

Everything identity-related lives in `site.config.mjs` — GitHub account, repo
name, domain, Discord, store and YouTube links. Nothing else needs editing when
one of them changes.

### Moving to a custom domain

1. Set `domain: 'docs.nuggscripts.com'` in `site.config.mjs`. The site URL and base
   path both follow automatically.
2. Add `public/CNAME` containing that hostname on one line.
3. Point a `CNAME` DNS record at `<user>.github.io`.
4. In the repository's **Settings → Pages**, enter the domain and enable
   *Enforce HTTPS*.
5. Run `npm run sync` and rebuild.

Internal links are written relative to the page, so they survive the base path
changing from `/nuggscripts-docs` to `/`.
