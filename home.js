const canvas = document.getElementById("home-field");
const ctx = canvas.getContext("2d");
const depthEls = document.querySelectorAll("[data-depth]");
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let W = 0, H = 0, dpr = 1;
let targetX = 0, targetY = 0, curX = 0, curY = 0;
let particles = [];

/* ── 3D math ────────────────────────────────────── */

function rotY(v, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

function rotX(v, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

function project(v, fov, cx, cy) {
  const z = v[2] + fov;
  if (z < 10) return null;
  const s = fov / z;
  return [v[0] * s + cx, v[1] * s + cy, z];
}

/* ── Mesh generators ────────────────────────────── */

function meshBox(w, h, d, ox, oy, oz) {
  const hw = w / 2, hh = h / 2, hd = d / 2;
  const v = [
    [ox - hw, oy - hh, oz - hd], [ox + hw, oy - hh, oz - hd],
    [ox + hw, oy + hh, oz - hd], [ox - hw, oy + hh, oz - hd],
    [ox - hw, oy - hh, oz + hd], [ox + hw, oy - hh, oz + hd],
    [ox + hw, oy + hh, oz + hd], [ox - hw, oy + hh, oz + hd],
  ];
  const e = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  return { verts: v, edges: e };
}

function meshIcosahedron(r, ox, oy, oz) {
  const t = (1 + Math.sqrt(5)) / 2;
  const n = Math.sqrt(1 + t * t);
  const a = r / n, b = t * r / n;
  const v = [
    [-a+ox, b+oy, oz], [a+ox, b+oy, oz], [-a+ox, -b+oy, oz], [a+ox, -b+oy, oz],
    [ox, -a+oy, b+oz], [ox, a+oy, b+oz], [ox, -a+oy, -b+oz], [ox, a+oy, -b+oz],
    [b+ox, oy, -a+oz], [b+ox, oy, a+oz], [-b+ox, oy, -a+oz], [-b+ox, oy, a+oz],
  ];
  const e = [
    [0,1],[0,5],[0,7],[0,10],[0,11],[1,5],[1,7],[1,8],[1,9],
    [2,3],[2,4],[2,6],[2,10],[2,11],[3,4],[3,6],[3,8],[3,9],
    [4,5],[4,9],[4,11],[5,9],[5,11],[6,7],[6,8],[6,10],
    [7,8],[7,10],[8,9],[10,11]
  ];
  return { verts: v, edges: e };
}

function meshOctahedron(r, ox, oy, oz) {
  const v = [
    [ox, oy - r, oz], [ox, oy + r, oz],
    [ox - r, oy, oz], [ox + r, oy, oz],
    [ox, oy, oz - r], [ox, oy, oz + r],
  ];
  const e = [
    [0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],
    [2,4],[4,3],[3,5],[5,2]
  ];
  return { verts: v, edges: e };
}

function meshGrid(size, divisions, oy) {
  const verts = [];
  const edges = [];
  const step = size / divisions;
  const half = size / 2;
  for (let i = 0; i <= divisions; i++) {
    const off = -half + i * step;
    const a = verts.length;
    verts.push([-half, oy, off], [half, oy, off]);
    edges.push([a, a + 1]);
    const b = verts.length;
    verts.push([off, oy, -half], [off, oy, half]);
    edges.push([b, b + 1]);
  }
  return { verts, edges };
}

function meshRing(r, segments, ox, oy, oz, tiltX, tiltZ) {
  const verts = [];
  const edges = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    let v = [Math.cos(a) * r + ox, oy, Math.sin(a) * r + oz];
    if (tiltX) v = rotX(v, tiltX);
    v[1] += oy;
    verts.push(v);
    if (i > 0) edges.push([i - 1, i]);
  }
  edges.push([segments - 1, 0]);
  return { verts, edges };
}

/* ── Scene definition ───────────────────────────── */

const scene = [
  { mesh: meshBox(60, 160, 50, 0, -40, 0), color: "rgba(244, 234, 217, 0.12)" },
  { mesh: meshBox(45, 120, 40, 80, -60, 30), color: "rgba(244, 234, 217, 0.10)" },
  { mesh: meshBox(50, 200, 45, -70, -20, -20), color: "rgba(244, 234, 217, 0.11)" },
  { mesh: meshBox(35, 90, 35, 110, -75, -50), color: "rgba(244, 234, 217, 0.08)" },
  { mesh: meshBox(40, 140, 38, -30, -50, 60), color: "rgba(244, 234, 217, 0.09)" },
  { mesh: meshIcosahedron(50, 30, -180, 10), color: "rgba(143, 191, 228, 0.18)" },
  { mesh: meshOctahedron(28, -50, -160, -30), color: "rgba(231, 165, 48, 0.16)" },
  { mesh: meshGrid(300, 8, 120), color: "rgba(244, 234, 217, 0.04)" },
  { mesh: meshRing(110, 48, 0, -120, 0, 1.2, 0), color: "rgba(143, 191, 228, 0.08)" },
  { mesh: meshRing(80, 36, 0, -120, 0, 0.5, 0.8), color: "rgba(231, 165, 48, 0.07)" },
];

/* ── Render ──────────────────────────────────────── */

function drawScene(t, cx, cy) {
  const fov = 500;
  const baseRotY = t * 0.15;
  const baseRotX = -0.3;
  const pointerRotY = curX * 0.6;
  const pointerRotX = curY * 0.3;

  for (const obj of scene) {
    const projected = [];
    for (const v of obj.mesh.verts) {
      let p = rotY(v, baseRotY + pointerRotY);
      p = rotX(p, baseRotX + pointerRotX);
      projected.push(project(p, fov, cx, cy));
    }

    ctx.strokeStyle = obj.color;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (const [a, b] of obj.mesh.edges) {
      const pa = projected[a];
      const pb = projected[b];
      if (!pa || !pb) continue;
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
    }
    ctx.stroke();
  }
}

/* ── Particles ──────────────────────────────────── */

function resize() {
  W = window.innerWidth;
  H = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.max(24, Math.floor((W * H) / 22000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 0.4 + Math.random() * 1.2,
    depth: 0.2 + Math.random() * 0.8,
    speed: 0.05 + Math.random() * 0.1,
    phase: Math.random() * Math.PI * 2
  }));
}

function drawParticles(t) {
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const drift = p.depth * 20;
    const px = p.x + curX * drift + Math.cos(t * p.speed + p.phase) * 2.5 * p.depth;
    const py = p.y + curY * drift * 0.7 + Math.sin(t * p.speed + p.phase * 1.3) * 2.5 * p.depth;

    ctx.beginPath();
    ctx.arc(px, py, p.r, 0, Math.PI * 2);

    if (i % 7 === 0) {
      ctx.fillStyle = `rgba(231, 165, 48, ${0.06 + p.depth * 0.06})`;
    } else if (i % 11 === 0) {
      ctx.fillStyle = `rgba(143, 191, 228, ${0.05 + p.depth * 0.05})`;
    } else {
      ctx.fillStyle = `rgba(244, 234, 217, ${0.025 + p.depth * 0.03})`;
    }
    ctx.fill();
  }
}

/* ── Loop ────────────────────────────────────────── */

function pointer(x, y) {
  targetX = x / W - 0.5;
  targetY = y / H - 0.5;
}

function tick(stamp) {
  const t = stamp * 0.001;
  ctx.clearRect(0, 0, W, H);

  if (!reduced) {
    curX += (targetX - curX) * 0.04;
    curY += (targetY - curY) * 0.04;

    depthEls.forEach((el) => {
      const d = Number(el.dataset.depth || 0);
      const isForm = el.closest(".home-forms");
      const scale = isForm ? 90 : 50;
      const dx = curX * d * scale + Math.sin(t * (0.3 + d)) * d * 10;
      const dy = curY * d * scale * 0.7 + Math.cos(t * (0.25 + d)) * d * 8;

      if (isForm) {
        el.style.setProperty("--dx", `${dx}px`);
        el.style.setProperty("--dy", `${dy}px`);
      } else {
        el.style.setProperty("--tx", `${dx}px`);
        el.style.setProperty("--ty", `${dy}px`);
      }
    });
  }

  drawParticles(t);
  drawScene(t, W * 0.68, H * 0.46);

  requestAnimationFrame(tick);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (e) => pointer(e.clientX, e.clientY));
window.addEventListener("pointerleave", () => { targetX = 0; targetY = 0; });

resize();
requestAnimationFrame(tick);
