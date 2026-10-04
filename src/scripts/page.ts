import { tilt } from './fx';

const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll<T>(s)];

/* Kind tabs, text search and sorting over a grid of product cards. Also follows
   #script / #mlo / #props / #bundle in the URL so header links land filtered. */
export function initFilters() {
  for (const group of $$('[data-filter-for]')) {
    const grid = document.getElementById(group.dataset.filterFor!);
    if (!grid) continue;
    const search = document.querySelector<HTMLInputElement>(`[data-search-for="${grid.id}"]`);
    const sort = document.querySelector<HTMLSelectElement>(`[data-sort-for="${grid.id}"]`);
    const empty = document.querySelector<HTMLElement>(`[data-empty-for="${grid.id}"]`);
    const cards = $$<HTMLElement>('.card', grid);
    let kind = 'all';
    const apply = () => {
      const q = (search?.value ?? '').toLowerCase().trim().split(/\s+/).filter(Boolean);
      let shown = 0;
      for (const c of cards) {
        const ok = (kind === 'all' || c.dataset.kind === kind) && q.every((w) => c.dataset.name!.includes(w));
        c.classList.toggle('is-hidden', !ok);
        if (ok) { shown++; c.classList.add('in'); }
      }
      if (empty) empty.hidden = shown > 0;
      if (sort) {
        const by = sort.value;
        const sorted = [...cards].sort((a, b) =>
          by === 'price-asc' ? +a.dataset.price! - +b.dataset.price! :
          by === 'price-desc' ? +b.dataset.price! - +a.dataset.price! :
          by === 'new' ? (b.dataset.updated! > a.dataset.updated! ? 1 : -1) :
          +a.dataset.order! - +b.dataset.order!);
        sorted.forEach((c) => grid.appendChild(c));
      }
    };
    const setKind = (k: string) => {
      kind = k;
      $$<HTMLButtonElement>('button', group).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
      apply();
    };
    group.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-k]');
      if (!b) return;
      setKind(b.dataset.k!);
      if (group.dataset.hash !== undefined) history.replaceState(null, '', b.dataset.k === 'all' ? location.pathname : `#${b.dataset.k}`);
    });
    search?.addEventListener('input', apply);
    sort?.addEventListener('change', apply);
    const fromHash = () => {
      const h = location.hash.slice(1);
      if (group.dataset.hash !== undefined && $$<HTMLButtonElement>('button', group).some((b) => b.dataset.k === h)) setKind(h);
    };
    addEventListener('hashchange', fromHash);
    fromHash();
  }
}

export function initCountdowns() {
  for (const el of $$('[data-until]')) {
    const end = Date.parse(el.dataset.until!);
    const f = (n: number) => String(n).padStart(2, '0');
    const tick = () => {
      const ms = end - Date.now();
      if (ms <= 0) { el.remove(); return; }
      const s = Math.floor(ms / 1000);
      const set = (k: string, v: string) => { const b = el.querySelector(`[data-cd="${k}"]`); if (b) b.textContent = v; };
      set('d', f(Math.floor(s / 86400))); set('h', f(Math.floor((s % 86400) / 3600))); set('m', f(Math.floor((s % 3600) / 60))); set('s', f(s % 60));
      setTimeout(tick, 1000 - (Date.now() % 1000));
    };
    tick();
  }
}

/* Click-to-load YouTube: nothing from YouTube loads until the visitor asks. */
export function initVideoFacades() {
  for (const el of $$('[data-yt]')) {
    const id = el.dataset.yt;
    if (!id) continue;
    const go = () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      f.title = 'Showcase video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      el.replaceChildren(f);
      el.removeAttribute('role'); el.removeAttribute('tabindex');
    };
    el.addEventListener('click', go, { once: true });
    el.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') { e.preventDefault(); go(); } }, { once: true });
  }
}

export function initGallery() {
  const g = document.querySelector<HTMLElement>('[data-gallery]');
  if (!g) return;
  const main = g.querySelector<HTMLImageElement>('.main img')!;
  const mainBox = g.querySelector<HTMLElement>('.main')!;
  const thumbs = $$<HTMLButtonElement>('.thumbs button', g);
  thumbs.forEach((t) => t.addEventListener('click', () => {
    thumbs.forEach((x) => x.setAttribute('aria-current', String(x === t)));
    main.style.opacity = '0';
    const src = t.dataset.full!;
    const img = new Image();
    img.onload = () => { main.src = src; main.style.opacity = '1'; };
    img.src = src;
    mainBox.dataset.shot = src;
  }));
  tilt(g);
}
