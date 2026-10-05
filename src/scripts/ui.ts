import * as Cart from './cart';
import { reduced } from './fx';

const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/* Drawer ------------------------------------------------------------------ */

const drawer = $('#ns-drawer')!;
const scrim = $('#ns-scrim')!;
let lastFocus: Element | null = null;

export function openCart() {
  lastFocus = document.activeElement;
  drawer.classList.add('open'); scrim.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  $<HTMLButtonElement>('.x', drawer)?.focus();
  refreshWho();
}
export function closeCart() {
  drawer.classList.remove('open'); scrim.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  (lastFocus as HTMLElement | null)?.focus?.();
}

const icon = {
  trash: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>',
};

function render() {
  const items = Cart.items();
  $$('.cart-btn .count').forEach((c) => (c.textContent = String(items.length)));
  $$<HTMLButtonElement>('[data-add]').forEach((b) => {
    const id = Number(b.dataset.add), on = Cart.inCart(id);
    b.classList.toggle('is-added', on);
    const label = b.querySelector('.lbl');
    if (label) label.textContent = on ? 'In cart' : b.dataset.label || 'Add to cart';
  });
  const lines = $('.lines', drawer)!;
  if (!items.length) {
    lines.innerHTML = `<div class="empty">${icon.cart}<p>Your cart is empty.</p><a class="btn btn-ghost btn-sm" href="/store/">Browse the store</a></div>`;
  } else {
    const redundant = new Set(Cart.redundant());
    lines.innerHTML = items.map((p) => `
      <div class="line">
        <img src="${esc(p.image)}" alt="" loading="lazy" />
        <div><b>${esc(p.short)}</b><span>${p.kind === 'bundle' ? 'Bundle' : p.kind.toUpperCase()} · <span data-price-id="${p.id}">${Cart.money(p.price)}</span></span>
        ${redundant.has(p.id) ? '<span style="display:block;color:var(--gold)">Already included in a bundle in your cart</span>' : ''}</div>
        <button class="rm" data-rm="${p.id}" aria-label="Remove ${esc(p.short)}">${icon.trash}</button>
      </div>`).join('') +
      Cart.bundleSwaps().map((s) => `
      <div class="swap"><b>Save ${Cart.money(s.save)}</b> — the <b>${esc(s.bundle.short)}</b> includes ${s.parts.map((p) => esc(p.short)).join(' + ')} for ${Cart.money(s.bundle.price)}.
        <div style="margin-top:10px"><button class="btn btn-gold btn-sm" data-swap="${s.bundle.id}">Switch to the bundle</button></div></div>`).join('');
  }
  $('.tot .price', drawer)!.textContent = items.length ? Cart.money(Cart.total()) : '$0.00';
  const go = $<HTMLButtonElement>('[data-checkout]', drawer)!;
  go.disabled = !items.length;
}

async function refreshWho() {
  const who = $('.who', drawer)!;
  const go = $<HTMLButtonElement>('[data-checkout]', drawer)!;
  const b = await Cart.currentBasket();
  if (b?.username) {
    who.hidden = false;
    who.innerHTML = `Logged in as <b>${esc(b.username)}</b>. Your purchase is granted to this Cfx.re account. <button class="linkish" data-relogin>Not you?</button>`;
    go.querySelector('.lbl')!.textContent = 'Pay securely';
  } else {
    who.hidden = false;
    who.innerHTML = 'You log in with <b>FiveM</b> at checkout. Use the Cfx.re account that owns your server key — that is the account the assets are granted to.';
    go.querySelector('.lbl')!.textContent = 'Log in with FiveM & checkout';
  }
}

async function checkout(btn: HTMLButtonElement) {
  const err = $('.err', drawer)!;
  err.textContent = '';
  btn.disabled = true;
  const label = btn.querySelector('.lbl')!;
  const was = label.textContent;
  label.textContent = 'Connecting to Tebex…';
  try {
    const b = await Cart.currentBasket();
    if (!b?.username) { await Cart.login(); return; }
    const synced = await Cart.syncBasket(b);
    await Cart.pay(synced, () => { closeCart(); location.href = '/store/thanks/'; });
  } catch (e: any) {
    err.textContent = e?.message || 'Something went wrong talking to Tebex. Please try again.';
  } finally {
    btn.disabled = !Cart.items().length;
    label.textContent = was;
  }
}

/* Toast and fly-to-cart ------------------------------------------------------ */

let toastTimer = 0;
function toast(html: string) {
  const t = $('#ns-toast')!;
  t.innerHTML = html;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('show'), 2600);
}

function fly(from: Element, img: string) {
  if (reduced()) return;
  const target = $('.cart-btn');
  if (!target) return;
  const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
  const f = document.createElement('img');
  f.src = img; f.className = 'flyer'; f.alt = '';
  f.style.left = `${a.left + a.width / 2 - 32}px`; f.style.top = `${a.top + a.height / 2 - 22}px`;
  document.body.appendChild(f);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  f.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(.8) rotate(-8deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(.2) rotate(10deg)`, opacity: 0.2 },
  ], { duration: 760, easing: 'cubic-bezier(.5,0,.3,1)' }).finished.then(() => {
    f.remove();
    target.classList.remove('bump'); void (target as HTMLElement).offsetWidth; target.classList.add('bump');
  });
}

/* Lightbox ------------------------------------------------------------------ */

const lb = $('#ns-lightbox')!;
let shots: string[] = [], at = 0;
function showShot(i: number) {
  at = (i + shots.length) % shots.length;
  const img = $<HTMLImageElement>('img', lb)!;
  img.src = shots[at];
  $('.count', lb)!.textContent = `${at + 1} / ${shots.length}`;
}
export function openLightbox(list: string[], i: number) {
  shots = list; showShot(i);
  lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
  $<HTMLButtonElement>('.close', lb)?.focus();
}
function closeLightbox() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); }

/* Command palette --------------------------------------------------------- */

type Entry = { t: string; s: string; href: string; k: string; img?: string };
const pal = $('#ns-palette')!;
const index: Entry[] = JSON.parse($('#ns-index')?.textContent || '[]');
let sel = 0, results: Entry[] = [];
function search(q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  results = (words.length ? index.filter((e) => words.every((w) => (e.t + ' ' + e.s + ' ' + e.k).toLowerCase().includes(w))) : index).slice(0, 12);
  sel = 0;
  $('ul', pal)!.innerHTML = results.map((e, i) => `<li><a href="${e.href}" aria-selected="${i === 0}">${e.img ? `<img src="${esc(e.img)}" alt="" />` : ''}<span class="t"><b>${esc(e.t)}</b><span>${esc(e.s)}</span></span><span class="k">${esc(e.k)}</span></a></li>`).join('') || '<li style="padding:16px;color:var(--muted)">Nothing matches that.</li>';
}
function openPalette() { pal.classList.add('open'); const i = $<HTMLInputElement>('input', pal)!; i.value = ''; search(''); i.focus(); }
function closePalette() { pal.classList.remove('open'); }

/* Wiring -------------------------------------------------------------------- */

export function initUI() {
  Cart.onCart(render);

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const add = t.closest<HTMLButtonElement>('[data-add]');
    if (add) {
      e.preventDefault();
      const id = Number(add.dataset.add);
      const p = Cart.byId.get(id);
      if (Cart.inCart(id)) { openCart(); return; }
      if (Cart.add(id) && p) {
        fly(add, p.image);
        toast(`<img src="${esc(p.image)}" alt="" /> <span><b>${esc(p.short)}</b> added to your cart</span> <button class="btn btn-sm btn-ghost" data-open-cart>View cart</button>`);
        if (add.dataset.buyNow !== undefined) openCart();
      }
      return;
    }
    if (t.closest('[data-buy]')) { const id = Number(t.closest<HTMLElement>('[data-buy]')!.dataset.buy); Cart.add(id); openCart(); return; }
    if (t.closest('[data-open-cart], .cart-btn')) { e.preventDefault(); openCart(); return; }
    if (t.closest('#ns-scrim, #ns-drawer .x')) { closeCart(); return; }
    const rm = t.closest<HTMLElement>('[data-rm]'); if (rm) { Cart.remove(Number(rm.dataset.rm)); return; }
    const sw = t.closest<HTMLElement>('[data-swap]'); if (sw) { Cart.swapToBundle(Number(sw.dataset.swap)); return; }
    const go = t.closest<HTMLButtonElement>('[data-checkout]'); if (go) { checkout(go); return; }
    if (t.closest('[data-relogin]')) { Cart.forgetBasket(); Cart.login(); return; }
    if (t.closest('[data-palette]')) { e.preventDefault(); openPalette(); return; }
    if (t === pal) { closePalette(); return; }
    const z = t.closest<HTMLAnchorElement>('a.nszoom, [data-shot]');
    if (z) {
      const gal = z.closest<HTMLElement>('[data-gallery]');
      const list: string[] = gal?.dataset.shots ? JSON.parse(gal.dataset.shots) : $$<HTMLAnchorElement>('a.nszoom').map((a) => a.href);
      const uniq = [...new Set(list)];
      const cur = (z as HTMLAnchorElement).href || z.dataset.shot!;
      e.preventDefault();
      openLightbox(uniq, Math.max(0, uniq.indexOf(cur)));
      return;
    }
    if (t.closest('#ns-lightbox .close') || t === lb) closeLightbox();
    if (t.closest('#ns-lightbox .nav-l')) showShot(at - 1);
    if (t.closest('#ns-lightbox .nav-r')) showShot(at + 1);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.classList.contains('open') ? closePalette() : openPalette(); return; }
    if (e.key === '/' && !/input|textarea/i.test((e.target as HTMLElement).tagName)) { e.preventDefault(); openPalette(); return; }
    if (e.key === 'Escape') { closePalette(); closeLightbox(); closeCart(); return; }
    if (lb.classList.contains('open')) { if (e.key === 'ArrowLeft') showShot(at - 1); if (e.key === 'ArrowRight') showShot(at + 1); }
    if (pal.classList.contains('open') && results.length) {
      const links = $$<HTMLAnchorElement>('li a', pal);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links.forEach((a, i) => a.setAttribute('aria-selected', String(i === sel)));
        links[sel].scrollIntoView({ block: 'nearest' });
      }
      if (e.key === 'Enter') { e.preventDefault(); links[sel]?.click(); }
    }
  });
  $<HTMLInputElement>('input', pal)?.addEventListener('input', (e) => search((e.target as HTMLInputElement).value));

  let sx = 0;
  lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) showShot(at + (d < 0 ? 1 : -1)); });

  const params = new URLSearchParams(location.search);
  if (params.get('checkout') === 'resume') {
    history.replaceState(null, '', location.pathname);
    openCart();
  }
  Cart.refreshPrices();
}
