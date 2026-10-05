/* Motion is on unless the visitor turns it off with the footer switch. The OS
   "reduce motion" setting is not used: this site's animation is its brand, and
   the switch gives anyone who needs stillness a one-click way to get it. */
export const reduced = () => document.documentElement.classList.contains('motion-off');

export function motionToggle() {
  const btn = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  if (!btn) return;
  const sync = () => {
    const off = reduced();
    btn.setAttribute('aria-pressed', String(!off));
    btn.querySelector('.state')!.textContent = off ? 'Off' : 'On';
  };
  sync();
  btn.addEventListener('click', () => {
    const off = !reduced();
    try { localStorage.setItem('ns-motion', off ? 'off' : 'on'); } catch {}
    location.reload();
  });
}
const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Race-green aurora: a full-screen fragment shader of domain-warped noise,
   rendered at reduced resolution and paused whenever the tab is hidden. */
export function aurora(canvas: HTMLCanvasElement, gain = 1) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) { canvas.remove(); return; }
  const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const fs = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec2 m;uniform float s;uniform float g;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y);}
float fb(vec2 p){float v=0.,a=.5;for(int k=0;k<5;k++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/r;vec2 p=(gl_FragCoord.xy-.5*r)/r.y;
 float tt=t*.11;
 p+=vec2(.05*sin(t*.07),-t*.035);
 vec2 q=vec2(fb(p*1.6+tt),fb(p*1.6-tt+3.1));
 vec2 w=vec2(fb(p*1.3+2.*q+vec2(1.7,9.2)+tt*1.3),fb(p*1.3+2.*q+vec2(8.3,2.8)-tt));
 float f=fb(p*1.2+2.4*w);
 vec2 mm=(m-.5*r)/r.y;float md=exp(-3.2*length(p-mm));
 vec3 bg=vec3(.006,.03,.018);
 vec3 brg=vec3(0.,.26,.145);vec3 neon=vec3(.18,.82,.48);vec3 gold=vec3(.97,.88,.09);
 vec3 c=bg;
 c=mix(c,brg,smoothstep(.25,.85,f)*.9);
 c=mix(c,neon,smoothstep(.62,1.05,f*(1.+.35*w.x))*.38);
 c+=gold*pow(smoothstep(.72,1.,w.y*f*1.6),3.)*.22;
 c+=neon*md*.10;
 float band=smoothstep(.0,.9,1.-abs(uv.y-.55-.18*sin(uv.x*3.1+tt*4.))*2.2);
 c+=brg*band*.25;
 float vig=smoothstep(1.25,.25,length((uv-.5)*vec2(1.1,1.35)));
 c*=mix(.35,1.,vig);
 c*=1.-s*.18;
 c=bg+(c-bg)*g;
 gl_FragColor=vec4(c,1.);
}`;
  const sh = (type: number, src: string) => { const o = gl.createShader(type)!; gl.shaderSource(o, src); gl.compileShader(o); return o; };
  const pr = gl.createProgram()!;
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(pr);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(pr, 'r'), uT = gl.getUniformLocation(pr, 't'), uM = gl.getUniformLocation(pr, 'm'), uS = gl.getUniformLocation(pr, 's'), uG = gl.getUniformLocation(pr, 'g');
  gl.uniform1f(uG, gain);
  const scale = 0.5;
  let W = 0, H = 0, mx = 0, my = 0, tx = 0, ty = 0, scroll = 0;
  const size = () => {
    W = Math.max(1, Math.floor(innerWidth * scale)); H = Math.max(1, Math.floor(innerHeight * scale));
    canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H); gl.uniform2f(uR, W, H);
    tx = mx = W * 0.7; ty = my = H * 0.6;
  };
  size();
  addEventListener('resize', size, { passive: true });
  addEventListener('pointermove', (e) => { tx = e.clientX * scale; ty = H - e.clientY * scale; }, { passive: true });
  addEventListener('scroll', () => { scroll = Math.min(1, scrollY / (innerHeight * 1.5)); }, { passive: true });
  const t0 = performance.now();
  const still = reduced();
  let raf = 0;
  const frame = (now: number) => {
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    gl.uniform1f(uT, still ? 12 : (now - t0) / 1000);
    gl.uniform2f(uM, mx, my);
    gl.uniform1f(uS, scroll);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!still) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(raf);
    if (!document.hidden && !still) raf = requestAnimationFrame(frame);
  });
}

/* Gold and green embers rising behind the hero, pushed away by the pointer. */
export function embers(canvas: HTMLCanvasElement) {
  if (reduced()) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  let W = 0, H = 0;
  type P = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; gold: boolean };
  const ps: P[] = [];
  const spawn = (fresh = false): P => ({
    x: Math.random() * W, y: fresh ? Math.random() * H : H + 10, vx: (Math.random() - 0.5) * 0.25, vy: -(0.25 + Math.random() * 0.8),
    r: (0.6 + Math.random() * 1.8) * dpr, life: 0, max: 280 + Math.random() * 380, gold: Math.random() < 0.35,
  });
  const size = () => {
    const b = canvas.getBoundingClientRect();
    W = canvas.width = Math.floor(b.width * dpr); H = canvas.height = Math.floor(b.height * dpr);
  };
  size();
  new ResizeObserver(size).observe(canvas);
  const count = Math.min(110, Math.floor((W * H) / (9000 * dpr * dpr)));
  for (let i = 0; i < count; i++) ps.push(spawn(true));
  let px = -1e9, py = -1e9;
  canvas.parentElement?.addEventListener('pointermove', (e) => { const b = canvas.getBoundingClientRect(); px = (e.clientX - b.left) * dpr; py = (e.clientY - b.top) * dpr; }, { passive: true });
  canvas.parentElement?.addEventListener('pointerleave', () => { px = py = -1e9; });
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(tick); }).observe(canvas);
  function tick() {
    if (!visible || document.hidden) return;
    ctx!.clearRect(0, 0, W, H);
    ctx!.globalCompositeOperation = 'lighter';
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const dx = p.x - px, dy = p.y - py, d2 = dx * dx + dy * dy, R = 140 * dpr;
      if (d2 < R * R) { const f = (1 - Math.sqrt(d2) / R) * 0.9; p.vx += (dx / Math.sqrt(d2 + 1)) * f; p.vy += (dy / Math.sqrt(d2 + 1)) * f; }
      p.vx *= 0.96; p.vy = p.vy * 0.96 - 0.03;
      p.x += p.vx + Math.sin((p.life + i * 13) * 0.02) * 0.25; p.y += p.vy; p.life++;
      const a = Math.sin((p.life / p.max) * Math.PI);
      const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      const col = p.gold ? '247,224,23' : '47,210,122';
      g.addColorStop(0, `rgba(${col},${0.9 * a})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx!.fill();
      if (p.life > p.max || p.y < -20) ps[i] = spawn();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* 3D tilt, glare and a gradient border that follows the pointer. */
export function tilt(root: ParentNode = document) {
  if (!fine() || reduced()) return;
  root.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    if (el.dataset.tiltBound) return;
    el.dataset.tiltBound = '1';
    const max = Number(el.dataset.tilt) || 7;
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
      el.style.setProperty('--mx', `${x * 100}%`); el.style.setProperty('--my', `${y * 100}%`);
      el.style.setProperty('--ry', `${(x - 0.5) * max * 2}deg`); el.style.setProperty('--rx', `${(0.5 - y) * max * 2}deg`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });
}

/* Buttons that lean toward the pointer. */
export function magnetic() {
  if (!fine() || reduced()) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const b = el.getBoundingClientRect();
      el.style.setProperty('--bx', `${(e.clientX - b.left - b.width / 2) * 0.22}px`);
      el.style.setProperty('--by', `${(e.clientY - b.top - b.height / 2) * 0.3}px`);
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--bx', '0px'); el.style.setProperty('--by', '0px'); });
  });
}

/* Splits a heading into characters so they can be revealed one after another. */
export function splitText(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    let i = 0;
    const walk = (node: Node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const word of (child.textContent ?? '').split(/(\s+)/)) {
            if (!word) continue;
            if (/^\s+$/.test(word)) { frag.append(document.createTextNode(word)); continue; }
            const w = document.createElement('span'); w.className = 'w';
            for (const ch of word) { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', String(i++)); s.textContent = ch; w.append(s); }
            frag.append(w);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && (child as Element).tagName !== 'BR') walk(child);
      }
    };
    el.setAttribute('aria-label', el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
    walk(el);
    el.classList.add('split');
  });
}

export function reveal(root: ParentNode = document) {
  const els = root.querySelectorAll<HTMLElement>('.reveal, .split');
  if (reduced() || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  els.forEach((e) => io.observe(e));
}

export function countUp() {
  const els = document.querySelectorAll<HTMLElement>('[data-count]');
  const run = (el: HTMLElement) => {
    const end = Number(el.dataset.count), dec = Number(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    if (reduced()) { el.textContent = pre + end.toFixed(dec) + suf; return; }
    const t0 = performance.now(), dur = 1600;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = pre + (end * e).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((en) => en.forEach((e) => { if (e.isIntersecting) { run(e.target as HTMLElement); io.unobserve(e.target); } }), { threshold: 0.5 });
  els.forEach((e) => io.observe(e));
}

export function chrome() {
  const header = document.querySelector('.ns-header');
  const bar = document.getElementById('ns-progress');
  const halo = document.querySelector<HTMLElement>('.ns-halo');
  const onScroll = () => {
    header?.classList.toggle('is-stuck', scrollY > 8);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar?.style.setProperty('--p', String(max > 0 ? scrollY / max : 0));
  };
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
  if (halo && fine() && !reduced()) {
    let x = -999, y = -999, cx = x, cy = y;
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => { cx += (x - cx) * 0.12; cy += (y - cy) * 0.12; halo.style.setProperty('--hx', `${cx}px`); halo.style.setProperty('--hy', `${cy}px`); requestAnimationFrame(loop); };
    loop();
  }
  const menu = document.querySelector<HTMLButtonElement>('.menu-btn');
  const nav = document.querySelector('.nav');
  menu?.addEventListener('click', () => { const o = nav?.classList.toggle('open'); menu.setAttribute('aria-expanded', String(!!o)); });
}

/* Five red lights, then green: shown once per session on the landing page. */
export function startLights() {
  const el = document.querySelector<HTMLElement>('.lights');
  if (!el) return;
  let seen = false;
  try { seen = sessionStorage.getItem('ns-lights') === '1'; sessionStorage.setItem('ns-lights', '1'); } catch {}
  if (seen || reduced()) { el.remove(); document.documentElement.classList.add('lights-done'); return; }
  const pods = [...el.querySelectorAll('.pod')];
  const finish = () => { el.classList.add('go'); setTimeout(() => { el.classList.add('done'); document.documentElement.classList.add('lights-done'); setTimeout(() => el.remove(), 800); }, 380); };
  pods.forEach((p, i) => setTimeout(() => p.classList.add('on'), 180 + i * 230));
  const t = setTimeout(finish, 180 + pods.length * 230 + 420);
  el.querySelector('.skip')?.addEventListener('click', () => { clearTimeout(t); finish(); });
}
