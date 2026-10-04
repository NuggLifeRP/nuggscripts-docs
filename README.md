# NuggScripts docs

The NuggScripts website: an animated landing page and storefront at the root, and the
customer-facing documentation for every FiveM resource under it. Built with Astro and
[Astro Starlight](https://starlight.astro.build), deployed to GitHub Pages.

| Path | What |
| --- | --- |
| `/` | Landing page — `src/pages/index.astro` |
| `/store/`, `/store/<product>/` | Storefront — `src/pages/store/` |
| `/docs/` | Documentation welcome — `src/content/docs/docs.mdx` |
| everything else | Documentation pages (Starlight) |

## The store

Products, prices, covers and descriptions come from Tebex through the public Headless
API; nothing about a product is typed into this repo except what Tebex does not hold.

- `src/data/catalog.json` — a snapshot of the live catalogue. `npm run catalog`
  refreshes it, and CI refreshes it on every deploy (keeping the committed copy if
  Tebex is unreachable). Prices are also refreshed in the browser on page load.
- `src/data/store.config.mjs` — the public token, plus per-package extras: URL slug,
  one-line pitch, tags, docs link, featured/badge, bundle contents. A package added in
  Tebex appears without an entry here, with defaults.
- Checkout: the cart lives in the browser. On checkout a Tebex basket is created, the
  buyer logs in with FiveM (Tebex requires it before packages can be added), comes back
  to the page, and pays in the Tebex.js popup. Payment, tax and delivery stay with Tebex.
- To change a description, edit the generator in the store working folder, push it to
  Tebex, then `npm run catalog` (or just push — CI refreshes it).

The animated logo in `public/media/` is a stacked-alpha video (colour on top, alpha
below, 16 px gap) in AV1 with an HEVC fallback, recombined by a WebGL shader in
`src/scripts/logo.ts`. Every effect honours the visitor's reduced-motion setting.

## Documentation only

**This repository is public. The scripts it documents are paid, escrowed
products. Nothing but documentation may ever be committed here** — no `.lua`,
no `.sql`, no `fxmanifest.lua`, no stream assets, no credentials.

Two things enforce that:

- `.gitignore` blocks every resource file type, so they cannot be staged by
  accident.
- `npm run check:source` inspects what git actually tracks and fails on a
  blocked file type, a credential-shaped string, or a code block long enough to
  be a source dump rather than an example. It runs in CI **before** the build,
  so a mistake fails the deploy instead of publishing.

Run it yourself before any push:

```bash
npm run check:source
```

The Lua in these pages is limited to short usage examples — the same snippets
that ship to customers in the zip. `docs.sources.json` contains the local path
to each script folder, which is visible but discloses nothing beyond a folder
name on the build machine.

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
3. Add its card to `src/content/docs/docs.mdx`.
4. `npm run sync`, check the warnings are clean, commit.

## Commands

| | |
| --- | --- |
| `npm run sync` | Regenerate pages from the script folders |
| `npm run catalog` | Refresh the store catalogue snapshot from Tebex |
| `npm run dev` | Local preview with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run check:source` | Confirm the repo holds documentation only |
| `npm run check:links` | Verify every internal link and anchor in `dist/` |
| `node scripts/build-assets.mjs` | Rebuild the logo, favicon and social cards |

## Configuration

Everything identity-related lives in `site.config.mjs` — GitHub account, repo
name, domain, Discord, store and YouTube links. Nothing else needs editing when
one of them changes.

### Moving to nuggscripts.com

The site is served from the apex, so this needs A/AAAA records — an apex domain
cannot use a `CNAME` record.

1. Set `domain: 'nuggscripts.com'` in `site.config.mjs`. The site URL and the
   base path both follow automatically.
2. Add `public/CNAME` containing `nuggscripts.com` on one line.
3. At the DNS host, add four A records for `@`, all **DNS-only** (grey cloud on
   Cloudflare — proxying breaks GitHub's certificate issuance):

   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   And, for IPv6, four AAAA records for `@`:

   ```
   2606:50c0:8000::153
   2606:50c0:8001::153
   2606:50c0:8002::153
   2606:50c0:8003::153
   ```

   Optionally add a `CNAME` for `www` pointing at `nuggliferp.github.io` so
   `www.nuggscripts.com` works too.
4. In the repository's **Settings → Pages**, enter `nuggscripts.com` as the
   custom domain, wait for the DNS check to pass, then tick *Enforce HTTPS*.
   The certificate takes a few minutes.
5. Rebuild and push.

Internal links are written relative to the page, so they survive the base path
changing from `/nuggscripts-docs` to `/`.
