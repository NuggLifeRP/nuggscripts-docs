// The storefront's own data: everything the Tebex catalogue does not carry.
// Prices, names, covers and descriptions come from Tebex (src/data/catalog.json);
// this file adds the URL slug, the one-line pitch and the tags for each package.
// A package added in Tebex and missing here still appears, with defaults.

export const STORE = {
  // Tebex public token. Public by design: it can only read the catalogue and
  // create baskets. The private key never goes anywhere near this repository.
  publicToken: 'm9o2-ae62e9634f4c411be7d93fee82a6e06af473c6e8',
  tebexUrl: 'https://nuggscripts.tebex.io',
  currency: 'USD',
};

export const KINDS = {
  script: { label: 'Script', plural: 'Scripts', blurb: 'Full resources for ESX, QBCore and Qbox' },
  mlo: { label: 'MLO', plural: 'MLOs', blurb: 'Finished interiors that run on any framework' },
  props: { label: 'Props', plural: 'Props', blurb: 'Original props with inventory icons' },
  bundle: { label: 'Bundle', plural: 'Bundles', blurb: 'Whole collections for less' },
};

export const CATEGORY_KIND = {
  3436705: 'script',
  1921450: 'mlo',
  2983729: 'props',
};

export const PRODUCTS = {
  7667018: {
    slug: 'nuggs-multicharacter',
    short: 'Nugg’s Multicharacter',
    kind: 'script',
    pitch: 'Character selection, creation and arrival points in one resource — and it sells character slots for you.',
    tags: ['ESX Legacy', 'QBCore', 'Qbox', 'No ox_lib'],
    docs: '/nuggs-multicharacter/',
    featured: true,
    badge: 'New',
    promo: { text: 'Launch price — $29.99 after October 25, 2026', until: '2026-10-26T00:00:00Z' },
    order: 1,
  },
  7703257: {
    slug: 'cannabis-mlo-bundle',
    short: 'Cannabis MLO Bundle',
    kind: 'bundle',
    pitch: 'Hydroponics for the grow, High Time for the sale — fifteen rooms of cannabis RP in one checkout.',
    tags: ['2 MLOs', '15 rooms', 'Standalone'],
    parts: [6726502, 6804659],
    featured: true,
    order: 2,
  },
  7703276: {
    slug: 'all-prop-bundle',
    short: 'All Prop Bundle',
    kind: 'bundle',
    pitch: 'Every candy, crisp and soda prop with matching inventory icons — the whole collection at once.',
    tags: ['3 packs', '55+ props', 'Inventory icons'],
    parts: [6845050, 6847221, 6847269],
    featured: true,
    order: 3,
  },
  6804659: {
    slug: 'high-time-dispensary',
    short: 'High Time Dispensary',
    kind: 'mlo',
    pitch: 'A nine-room dispensary with a retail floor, grow room, processing lab and staff facilities.',
    tags: ['9 rooms', 'Standalone', 'Escrowed'],
    order: 10,
  },
  6726502: {
    slug: 'nugglife-hydroponics',
    short: 'NuggLife Hydroponics',
    kind: 'mlo',
    pitch: 'A six-room grow shop with a legal storefront and a back room that is anything but.',
    tags: ['6 rooms', 'Builds 1604 → 3407', 'Escrowed'],
    order: 11,
  },
  4697799: {
    slug: 'donut-shop',
    short: 'Donut Shop',
    kind: 'mlo',
    pitch: 'A full-colour donut shop built for police to sit between calls — dining room, service counter and back-of-house.',
    tags: ['Dining room', 'Standalone', 'Escrowed'],
    order: 12,
  },
  5371484: {
    slug: 'flickers-comic-shop',
    short: 'Flicker’s Comic Shop',
    kind: 'mlo',
    pitch: 'A trading-card and comic store with a shop floor, lounge, office and stock area.',
    tags: ['2 areas', 'Street shopfront', 'Escrowed'],
    order: 13,
  },
  6591400: {
    slug: 'old-shack',
    short: 'Old Shack',
    kind: 'mlo',
    pitch: 'A weathered rural shack with a furnished interior — a hideout, a drop point or a stash.',
    tags: ['Single room', 'Interior + exterior', 'Escrowed'],
    order: 14,
  },
  6845050: {
    slug: 'candy-bar-props',
    short: 'Candy Bar Bundle',
    kind: 'props',
    pitch: 'Eleven candy bars and a vending unit, with icons and ox_inventory code included.',
    tags: ['12 props', 'Vending unit', 'ox_inventory code'],
    order: 20,
  },
  6847221: {
    slug: 'chip-props',
    short: 'Chip Prop Bundle',
    kind: 'props',
    pitch: 'Thirty-plus crisp and snack bags, so a store shelf never repeats itself.',
    tags: ['30+ props', 'Inventory icons'],
    order: 21,
  },
  7717284: {
    slug: 'recycle-machine-prop',
    short: 'Recycle Machine',
    kind: 'props',
    pitch: 'A branded recycle machine with eight placements around the map — free and open source.',
    tags: ['Free', 'Open source', '8 placements'],
    badge: 'Free',
    order: 19,
  },
  6847269: {
    slug: 'soda-props',
    short: 'Soda Prop Bundle',
    kind: 'props',
    pitch: 'Thirteen soda cans in full and crushed versions, built for drink and recycling loops.',
    tags: ['13 designs', 'Full + crushed'],
    order: 22,
  },
};
