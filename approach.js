/* ── Background particle canvas ───────────────── */

const bgCanvas = document.getElementById("a-field");
const bgCtx = bgCanvas.getContext("2d");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let W = 0, H = 0, dpr = 1;
let particles = [];
let scrollY = 0;

function resizeBg() {
  W = window.innerWidth;
  H = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  bgCanvas.width = W * dpr;
  bgCanvas.height = H * dpr;
  bgCanvas.style.width = `${W}px`;
  bgCanvas.style.height = `${H}px`;
  bgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.max(20, Math.floor((W * H) / 24000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.3 + Math.random() * 1.2,
    depth: 0.2 + Math.random() * 0.8,
    speed: 0.04 + Math.random() * 0.1,
    phase: Math.random() * Math.PI * 2
  }));
}

function drawBg(t) {
  bgCtx.clearRect(0, 0, W, H);
  const scrollOff = scrollY * 0.15;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const px = p.x + Math.cos(t * p.speed + p.phase) * 3 * p.depth;
    const py = ((p.y - scrollOff * p.depth) % H + H) % H + Math.sin(t * p.speed + p.phase * 1.3) * 3 * p.depth;

    bgCtx.beginPath();
    bgCtx.arc(px, py, p.r, 0, Math.PI * 2);

    if (i % 7 === 0) bgCtx.fillStyle = `rgba(231,165,48,${0.06 + p.depth * 0.06})`;
    else if (i % 11 === 0) bgCtx.fillStyle = `rgba(143,191,228,${0.05 + p.depth * 0.05})`;
    else bgCtx.fillStyle = `rgba(244,234,217,${0.025 + p.depth * 0.03})`;
    bgCtx.fill();
  }
}

/* ── 3D math ─────────────────────────────────── */

function rotY(v, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0]*c + v[2]*s, v[1], -v[0]*s + v[2]*c];
}

function rotX(v, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0], v[1]*c - v[2]*s, v[1]*s + v[2]*c];
}

function proj(v, fov, cx, cy) {
  const z = v[2] + fov;
  if (z < 10) return null;
  const s = fov / z;
  return [v[0]*s + cx, v[1]*s + cy];
}

/* ── Mesh generators ─────────────────────────── */

function meshIcosahedron(r, ox, oy, oz) {
  const t = (1 + Math.sqrt(5)) / 2;
  const n = Math.sqrt(1 + t*t);
  const a = r/n, b = t*r/n;
  const v = [
    [-a+ox,b+oy,oz],[a+ox,b+oy,oz],[-a+ox,-b+oy,oz],[a+ox,-b+oy,oz],
    [ox,-a+oy,b+oz],[ox,a+oy,b+oz],[ox,-a+oy,-b+oz],[ox,a+oy,-b+oz],
    [b+ox,oy,-a+oz],[b+ox,oy,a+oz],[-b+ox,oy,-a+oz],[-b+ox,oy,a+oz],
  ];
  const e = [
    [0,1],[0,5],[0,7],[0,10],[0,11],[1,5],[1,7],[1,8],[1,9],
    [2,3],[2,4],[2,6],[2,10],[2,11],[3,4],[3,6],[3,8],[3,9],
    [4,5],[4,9],[4,11],[5,9],[5,11],[6,7],[6,8],[6,10],[7,8],[7,10],[8,9],[10,11]
  ];
  return { verts: v, edges: e };
}

function meshOctahedron(r, ox, oy, oz) {
  const v = [
    [ox,oy-r,oz],[ox,oy+r,oz],[ox-r,oy,oz],[ox+r,oy,oz],[ox,oy,oz-r],[ox,oy,oz+r],
  ];
  const e = [[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[4,3],[3,5],[5,2]];
  return { verts: v, edges: e };
}

function meshDodecahedron(r, ox, oy, oz) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const a = r * 0.6, b = a * phi, c = a / phi;
  const v = [
    [a+ox,a+oy,a+oz],[-a+ox,a+oy,a+oz],[a+ox,-a+oy,a+oz],[a+ox,a+oy,-a+oz],
    [-a+ox,-a+oy,a+oz],[-a+ox,a+oy,-a+oz],[a+ox,-a+oy,-a+oz],[-a+ox,-a+oy,-a+oz],
    [0+ox,c+oy,b+oz],[0+ox,-c+oy,b+oz],[0+ox,c+oy,-b+oz],[0+ox,-c+oy,-b+oz],
    [c+ox,b+oy,0+oz],[-c+ox,b+oy,0+oz],[c+ox,-b+oy,0+oz],[-c+ox,-b+oy,0+oz],
    [b+ox,0+oy,c+oz],[b+ox,0+oy,-c+oz],[-b+ox,0+oy,c+oz],[-b+ox,0+oy,-c+oz],
  ];
  const e = [
    [0,8],[0,12],[0,16],[1,8],[1,13],[1,18],[2,9],[2,14],[2,16],
    [3,10],[3,12],[3,17],[4,9],[4,15],[4,18],[5,10],[5,13],[5,19],
    [6,11],[6,14],[6,17],[7,11],[7,15],[7,19],[8,9],[10,11],[12,13],
    [14,15],[16,17],[18,19],
  ];
  return { verts: v, edges: e };
}

function meshRing(r, segs, ox, oy, oz) {
  const v = [], e = [];
  for (let i = 0; i < segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    v.push([Math.cos(a) * r + ox, oy, Math.sin(a) * r + oz]);
    if (i > 0) e.push([i - 1, i]);
  }
  e.push([segs - 1, 0]);
  return { verts: v, edges: e };
}

/* ── Hero 3D scene ───────────────────────────── */

const sceneCanvas = document.getElementById("a-scene-canvas");
const sCtx = sceneCanvas.getContext("2d");
let sW = 0, sH = 0;

const heroScene = [
  { mesh: meshIcosahedron(100, 0, 0, 0), color: "rgba(244,234,217,0.14)" },
  { mesh: meshOctahedron(48, 0, 0, 0), color: "rgba(231,165,48,0.18)" },
  { mesh: meshDodecahedron(140, 0, 0, 0), color: "rgba(143,191,228,0.10)" },
  { mesh: meshRing(130, 48, 0, 0, 0), color: "rgba(244,234,217,0.06)", tiltX: 1.2 },
  { mesh: meshRing(100, 36, 0, 0, 0), color: "rgba(231,165,48,0.07)", tiltX: 0.5, tiltZ: 0.8 },
  { mesh: meshRing(160, 60, 0, 0, 0), color: "rgba(143,191,228,0.05)", tiltX: 0.9, tiltZ: -0.4 },
];

function resizeScene() {
  const rect = sceneCanvas.parentElement.getBoundingClientRect();
  sW = rect.width;
  sH = rect.height;
  const sDpr = Math.min(window.devicePixelRatio || 1, 2);
  sceneCanvas.width = sW * sDpr;
  sceneCanvas.height = sH * sDpr;
  sceneCanvas.style.width = `${sW}px`;
  sceneCanvas.style.height = `${sH}px`;
  sCtx.setTransform(sDpr, 0, 0, sDpr, 0, 0);
}

let pointerX = 0, pointerY = 0, curPX = 0, curPY = 0;

function drawHeroScene(t) {
  sCtx.clearRect(0, 0, sW, sH);
  const fov = 400;
  const cx = sW / 2, cy = sH / 2;
  const ry = t * 0.2 + curPX * 0.5;
  const rx = -0.15 + curPY * 0.3;

  for (const obj of heroScene) {
    const projected = [];
    for (const v of obj.mesh.verts) {
      let p = v;
      if (obj.tiltX) p = rotX(p, obj.tiltX);
      if (obj.tiltZ) { // tilt around Z via XY rotation
        const c = Math.cos(obj.tiltZ), s = Math.sin(obj.tiltZ);
        p = [p[0]*c - p[1]*s, p[0]*s + p[1]*c, p[2]];
      }
      p = rotY(p, ry);
      p = rotX(p, rx);
      projected.push(proj(p, fov, cx, cy));
    }

    sCtx.strokeStyle = obj.color;
    sCtx.lineWidth = 0.8;
    sCtx.beginPath();
    for (const [a, b] of obj.mesh.edges) {
      const pa = projected[a], pb = projected[b];
      if (!pa || !pb) continue;
      sCtx.moveTo(pa[0], pa[1]);
      sCtx.lineTo(pb[0], pb[1]);
    }
    sCtx.stroke();
  }
}

/* ── Scroll reveals ──────────────────────────── */

const sections = document.querySelectorAll(".a-section, .a-closing");

function checkVisibility() {
  const trigger = window.innerHeight * 0.78;
  sections.forEach((el) => {
    if (el.getBoundingClientRect().top < trigger) el.classList.add("visible");
  });
}

/* ── Loop ────────────────────────────────────── */

function tick(stamp) {
  const t = stamp * 0.001;

  if (!reduced) {
    curPX += (pointerX - curPX) * 0.03;
    curPY += (pointerY - curPY) * 0.03;
  }

  drawBg(t);
  drawHeroScene(t);
  requestAnimationFrame(tick);
}

/* ── Events ──────────────────────────────────── */

window.addEventListener("resize", () => { resizeBg(); resizeScene(); });
window.addEventListener("scroll", () => { scrollY = window.scrollY; checkVisibility(); }, { passive: true });
window.addEventListener("pointermove", (e) => {
  pointerX = (e.clientX / W - 0.5) * 2;
  pointerY = (e.clientY / H - 0.5) * 2;
});
window.addEventListener("pointerleave", () => { pointerX = 0; pointerY = 0; });

resizeBg();
resizeScene();
checkVisibility();
requestAnimationFrame(tick);
