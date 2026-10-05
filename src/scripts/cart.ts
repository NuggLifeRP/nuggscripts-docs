import { STORE } from '../data/store.config.mjs';

type Item = { id: number; slug: string; short: string; name: string; kind: string; price: number; image: string; href: string; parts: number[] };

const API = `https://headless.tebex.io/api/accounts/${STORE.publicToken}`;
const BASKET_API = 'https://headless.tebex.io/api/baskets';
const CART_KEY = 'ns-cart';
const BASKET_KEY = 'ns-basket';

const store = {
  get<T>(k: string, d: T): T { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k: string) { try { localStorage.removeItem(k); } catch {} },
};

const catalog: Item[] = JSON.parse(document.getElementById('ns-catalog')?.textContent || '[]');
const byId = new Map(catalog.map((p) => [p.id, p]));
const money = (n: number) => (n === 0 ? 'Free' : `$${n.toFixed(2)}`);

let cart: number[] = store.get<number[]>(CART_KEY, []).filter((id) => byId.has(id));
const listeners = new Set<() => void>();
const emit = () => { store.set(CART_KEY, cart); listeners.forEach((f) => f()); };

export const onCart = (f: () => void) => { listeners.add(f); f(); };
export const inCart = (id: number) => cart.includes(id);
export const cartIds = () => [...cart];

export function add(id: number) {
  if (!byId.has(id) || cart.includes(id)) return false;
  cart.push(id);
  emit();
  return true;
}
export function remove(id: number) { cart = cart.filter((x) => x !== id); emit(); }
export function clear() { cart = []; emit(); }

/* If the cart already holds every part of a bundle, the bundle is cheaper. */
export function bundleSwaps() {
  const out: { bundle: Item; save: number; parts: Item[] }[] = [];
  for (const b of catalog) {
    if (!b.parts.length || cart.includes(b.id)) continue;
    const have = b.parts.filter((id) => cart.includes(id));
    if (have.length < Math.max(2, b.parts.length - 1)) continue;
    const parts = b.parts.map((id) => byId.get(id)!).filter(Boolean);
    const total = parts.reduce((t, p) => t + p.price, 0);
    const missing = parts.filter((p) => !cart.includes(p.id));
    const current = have.reduce((t, id) => t + (byId.get(id)?.price ?? 0), 0);
    const save = missing.length ? current + missing.reduce((t, p) => t + p.price, 0) - b.price : total - b.price;
    if (save > 0) out.push({ bundle: b, save, parts });
  }
  return out;
}

export function swapToBundle(bundleId: number) {
  const b = byId.get(bundleId);
  if (!b) return;
  cart = cart.filter((id) => !b.parts.includes(id));
  cart.push(bundleId);
  emit();
}

/* Items already covered by a bundle in the cart would be granted twice. */
export const redundant = () => catalog.filter((b) => b.parts.length && cart.includes(b.id)).flatMap((b) => b.parts).filter((id) => cart.includes(id));

export const total = () => cart.reduce((t, id) => t + (byId.get(id)?.price ?? 0), 0);
export const items = () => cart.map((id) => byId.get(id)!).filter(Boolean);

/* Live prices --------------------------------------------------------------- */

export async function refreshPrices() {
  try {
    const r = await fetch(`${API}/packages`, { headers: { accept: 'application/json' } });
    if (!r.ok) return;
    const { data } = await r.json();
    let changed = false;
    for (const p of data) {
      const it = byId.get(p.id);
      if (it && it.price !== p.total_price) { it.price = p.total_price; changed = true; }
      document.querySelectorAll<HTMLElement>(`[data-price-id="${p.id}"]`).forEach((el) => { el.textContent = money(p.total_price); });
    }
    if (changed) emit();
  } catch {}
}

/* Checkout ------------------------------------------------------------------
   Tebex will not add packages to a basket until the buyer has logged in with
   the Cfx.re account the assets are granted to. So: create a basket, send the
   buyer through FiveM login, and on the way back add the cart to the basket
   and open Tebex.js. The basket ident survives the round trip in storage. */

type Basket = { ident: string; username: string | null; complete: boolean; total_price: number; packages: { id: number }[]; links?: { checkout?: string } };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { accept: 'application/json', 'content-type': 'application/json', ...(init?.headers ?? {}) } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.detail || body?.title || `Tebex returned ${r.status}`);
  return body.data ?? body;
}

const getBasket = (ident: string) => api<Basket>(`${API}/baskets/${ident}`);

async function newBasket(): Promise<Basket> {
  const origin = location.origin;
  return api<Basket>(`${API}/baskets`, {
    method: 'POST',
    body: JSON.stringify({ complete_url: `${origin}/store/thanks/`, cancel_url: `${origin}/store/`, complete_auto_redirect: true }),
  });
}

export async function currentBasket(): Promise<Basket | null> {
  const ident = store.get<string | null>(BASKET_KEY, null);
  if (!ident) return null;
  try {
    const b = await getBasket(ident);
    if (b.complete) { store.del(BASKET_KEY); return null; }
    return b;
  } catch { store.del(BASKET_KEY); return null; }
}

export async function login() {
  let b = await currentBasket();
  if (!b) { b = await newBasket(); store.set(BASKET_KEY, b.ident); }
  const back = `${location.origin}${location.pathname}?checkout=resume`;
  const links = await api<{ name: string; url: string }[]>(`${API}/baskets/${b.ident}/auth?returnUrl=${encodeURIComponent(back)}`);
  const fivem = links.find((l) => /fivem|cfx/i.test(l.name)) ?? links[0];
  if (!fivem) throw new Error('Tebex did not return a login link.');
  location.href = fivem.url;
}

export async function syncBasket(b: Basket): Promise<Basket> {
  const want = new Set(cart);
  const have = new Set(b.packages.map((p) => p.id));
  let last = b;
  for (const id of have) if (!want.has(id)) last = await api<Basket>(`${BASKET_API}/${b.ident}/packages/remove`, { method: 'POST', body: JSON.stringify({ package_id: String(id) }) });
  for (const id of want) if (!have.has(id)) last = await api<Basket>(`${BASKET_API}/${b.ident}/packages`, { method: 'POST', body: JSON.stringify({ package_id: String(id), quantity: 1 }) });
  return last;
}

let tebexLoading: Promise<void> | null = null;
function loadTebex() {
  if ((window as any).Tebex) return Promise.resolve();
  tebexLoading ??= new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = 'https://js.tebex.io/v/1.js';
    s.onload = () => ok();
    s.onerror = () => fail(new Error('Could not load the Tebex checkout.'));
    document.head.appendChild(s);
  });
  return tebexLoading;
}

export async function pay(b: Basket, onDone: () => void) {
  await loadTebex();
  const Tebex = (window as any).Tebex;
  Tebex.checkout.init({
    ident: b.ident,
    theme: 'dark',
    colors: [{ name: 'primary', color: '#0f7a43' }, { name: 'secondary', color: '#f7e017' }],
  });
  Tebex.checkout.on('payment:complete', () => {
    store.del(BASKET_KEY);
    clear();
    onDone();
  });
  Tebex.checkout.launch();
}

export const forgetBasket = () => store.del(BASKET_KEY);
export { money, byId, catalog };
