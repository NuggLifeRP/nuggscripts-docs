import { reduced } from './fx';

/* Plays the animated logo with real transparency in every browser.
   The video stores colour in its top half and alpha in its bottom half
   ("stacked alpha") with a black gap between them so compression cannot bleed
   one half into the other. AV1 first, HEVC for Apple devices without AV1, a
   phone-sized variant for narrow screens. A shader recombines the halves into
   premultiplied RGBA. */
const GAP = 16;
const START = 3;

export function stackedLogo(host: HTMLElement) {
  const poster = host.querySelector('img');
  if (reduced()) return;
  const v = document.createElement('video');
  const small = host.getBoundingClientRect().width * Math.min(2, devicePixelRatio || 1) <= 440;
  const size = small ? 'mobile' : 'desktop';
  const av1 = host.dataset.av1!.replace('{size}', size), hevc = host.dataset.hevc!.replace('{size}', size);
  if (v.canPlayType('video/mp4; codecs="av01.0.05M.10"')) v.src = av1;
  else if (v.canPlayType('video/mp4; codecs="hvc1.2.4.L120.90"') || v.canPlayType('video/mp4; codecs="hvc1"')) v.src = hevc;
  else return;
  v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous';
  v.setAttribute('muted', ''); v.setAttribute('playsinline', '');

  const canvas = document.createElement('canvas');
  canvas.className = 'logo-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  if (!gl) return;

  const vs = `attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}`;
  const fs = `precision mediump float;varying vec2 uv;uniform sampler2D f;uniform vec2 k;
void main(){vec3 c=texture2D(f,vec2(uv.x,uv.y*k.x)).rgb;float a=clamp(texture2D(f,vec2(uv.x,k.y+uv.y*k.x)).r,0.,1.);
a=clamp((a-.015)/.97,0.,1.);gl_FragColor=vec4(c*a,a);}`;
  const sh = (t: number, s: string) => { const o = gl.createShader(t)!; gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const pr = gl.createProgram()!;
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const [k, val] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
  gl.clearColor(0, 0, 0, 0);

  let ready = false, visible = true, failed = false;
  const draw = () => {
    if (v.readyState < 2) return;
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
    } catch (e) { failed = true; host.dataset.state = `failed:${(e as Error).name}`; return; }
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!ready) {
      ready = true;
      host.classList.add('is-live');
      host.dataset.state = 'live';
    }
  };
  let lastT = -1, started = false;
  const pump = () => {
    if (failed) return;
    if (visible && !document.hidden && v.readyState >= 2 && v.currentTime !== lastT) { lastT = v.currentTime; draw(); }
    requestAnimationFrame(pump);
  };
  let tries = 0;
  const play = (): void => {
    if (!started) return;
    v.play().catch((e) => {
      host.dataset.state = `blocked:${e.name}`;
      if (e.name === 'AbortError' && tries++ < 5) setTimeout(() => { if (visible && !document.hidden) play(); }, 400);
    });
  };
  const uK = gl.getUniformLocation(pr, 'k');
  v.addEventListener('loadedmetadata', () => {
    const half = (v.videoHeight - GAP) / 2;
    canvas.width = v.videoWidth; canvas.height = half;
    gl.uniform2f(uK, half / v.videoHeight, (half + GAP) / v.videoHeight);
    gl.viewport(0, 0, canvas.width, canvas.height);
    host.appendChild(canvas);
    v.addEventListener('seeked', () => {
      draw();
      lastT = v.currentTime;
      started = true;
      pump();
      if (visible && !document.hidden) play();
    }, { once: true });
    v.currentTime = v.duration > START ? START : 0;
  }, { once: true });
  v.addEventListener('error', () => { failed = true; host.dataset.state = 'failed:video'; canvas.remove(); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !document.hidden) play(); else v.pause(); }).observe(host);
  document.addEventListener('visibilitychange', () => { if (document.hidden) v.pause(); else if (visible) play(); });
  if (poster) poster.decoding = 'async';
  v.load();
}

/* The logo leans toward the pointer and floats. */
export function parallax(el: HTMLElement) {
  if (reduced() || !matchMedia('(hover: hover)').matches) return;
  let tx = 0, ty = 0, x = 0, y = 0;
  addEventListener('pointermove', (e) => { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  const loop = () => {
    x += (tx - x) * 0.06; y += (ty - y) * 0.06;
    el.style.setProperty('--lx', x.toFixed(3)); el.style.setProperty('--ly', y.toFixed(3));
    requestAnimationFrame(loop);
  };
  loop();
}
