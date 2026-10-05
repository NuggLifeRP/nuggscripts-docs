import raw from '../data/catalog.json';
import sanitizeHtml from 'sanitize-html';
import { PRODUCTS, CATEGORY_KIND, KINDS, STORE } from '../data/store.config.mjs';

export type Kind = keyof typeof KINDS;

export interface Product {
  id: number;
  slug: string;
  name: string;
  short: string;
  kind: Kind;
  pitch: string;
  tags: string[];
  price: number;
  basePrice: number;
  discount: number;
  image: string;
  media: string[];
  description: string;
  updated: string;
  docs?: string;
  video?: string;
  featured: boolean;
  badge?: string;
  promo?: { text: string; until: string };
  parts: number[];
  order: number;
  tebexUrl: string;
  href: string;
  searchText: string;
}

/* Descriptions come from Tebex, which sanitises them already. They are cleaned
   again here so that nothing able to run code can reach a page even if the
   Tebex account were ever misused: no scripts, frames, forms or event handlers,
   and links and images only over https. */
const clean = (html: string) =>
  sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'hr', 'div', 'span', 'strong', 'b', 'em', 'i', 'u', 's', 'small', 'sup', 'sub', 'code', 'pre',
      'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tfoot',
      'tr', 'td', 'th', 'caption', 'colgroup', 'col', 'figure', 'figcaption'],
    allowedAttributes: {
      '*': ['style', 'class', 'title', 'align'],
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding'],
      td: ['colspan', 'rowspan', 'width'],
      th: ['colspan', 'rowspan', 'width'],
      col: ['span', 'width'],
    },
    allowedSchemes: ['https', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }, true) },
  });

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-');

const firstSentence = (html: string) => {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const m = text.match(/^(.{20,180}?[.!?])\s/);
  return m ? m[1] : text.slice(0, 160);
};

export const products: Product[] = raw.packages
  .map((p) => {
    const meta: any = (PRODUCTS as any)[p.id] ?? {};
    const kind: Kind = meta.kind ?? (CATEGORY_KIND as any)[p.category] ?? 'script';
    const slug = meta.slug ?? slugify(p.name);
    return {
      id: p.id,
      slug,
      name: p.name,
      short: meta.short ?? p.name,
      kind,
      pitch: meta.pitch ?? firstSentence(p.description),
      tags: meta.tags ?? [],
      price: p.price,
      basePrice: p.basePrice,
      discount: p.discount,
      image: p.image,
      media: p.media,
      description: clean(p.description).replace(/rgb\(\s*143,\s*171,\s*155\s*\)|#8fab9b/gi, '#2fd27a'),
      updated: p.updated,
      docs: meta.docs,
      video: meta.video,
      featured: !!meta.featured,
      badge: meta.badge,
      promo: meta.promo,
      parts: meta.parts ?? [],
      order: meta.order ?? 100 + p.order,
      tebexUrl: `${STORE.tebexUrl}/package/${p.id}`,
      href: `/store/${slug}/`,
      searchText: p.description.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').slice(0, 4000),
    } satisfies Product;
  })
  .sort((a, b) => a.order - b.order);

export const byId = new Map(products.map((p) => [p.id, p]));

export const money = (n: number) => (n === 0 ? 'Free' : `$${n.toFixed(2)}`);

export function bundleValue(p: Product) {
  const parts = p.parts.map((id) => byId.get(id)).filter(Boolean) as Product[];
  const total = parts.reduce((t, x) => t + x.price, 0);
  const save = Math.max(0, total - p.price);
  return { parts, total, save, pct: total ? Math.round((save / total) * 100) : 0 };
}

export const bundlesContaining = (id: number) => products.filter((p) => p.parts.includes(id));

export const ofKind = (k: Kind) => products.filter((p) => p.kind === k);

export const kinds = Object.entries(KINDS)
  .map(([key, v]) => ({ key: key as Kind, ...v, count: products.filter((p) => p.kind === key).length }))
  .filter((k) => k.count > 0);

export function related(p: Product, n = 3) {
  const same = products.filter((x) => x.id !== p.id && x.kind === p.kind);
  const other = products.filter((x) => x.id !== p.id && x.kind !== p.kind);
  return [...bundlesContaining(p.id), ...same, ...other].filter((x, i, a) => a.indexOf(x) === i && x.id !== p.id).slice(0, n);
}

/* Screenshots for the gallery: every image linked or shown in the Tebex
   description, in order, deduplicated, with the package cover first. */
export function galleryOf(p: Product): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (u: string) => { if (u && !seen.has(u)) { seen.add(u); out.push(u); } };
  add(p.image);
  for (const m of p.description.matchAll(/<img[^>]+src="([^"]+)"/g)) add(m[1]);
  return out;
}

export const storeData = () =>
  products.map((p) => ({ id: p.id, slug: p.slug, short: p.short, name: p.name, kind: p.kind, price: p.price, image: p.image, href: p.href, parts: p.parts, tags: p.tags, pitch: p.pitch }));
