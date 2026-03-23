const canvas = document.getElementById("field");
const context = canvas.getContext("2d");
const portrait = document.getElementById("portrait");
const copy = document.getElementById("copy");
const depthLayers = document.querySelectorAll("[data-depth]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let dpr = 1;
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;
let particles = [];

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.max(36, Math.floor(width / 24));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: 0.6 + Math.random() * 2,
    depth: 0.35 + Math.random() * 1.1,
    vx: (Math.random() - 0.5) * 0.08,
    vy: (Math.random() - 0.5) * 0.08,
    cyan: Math.random() > 0.78
  }));
}

function setPointer(clientX, clientY) {
  targetX = clientX / width - 0.5;
  targetY = clientY / height - 0.5;
}

function wrapParticle(particle) {
  if (particle.x < -40) particle.x = width + 40;
  if (particle.x > width + 40) particle.x = -40;
  if (particle.y < -40) particle.y = height + 40;
  if (particle.y > height + 40) particle.y = -40;
}

function drawField(time) {
  context.clearRect(0, 0, width, height);

  for (const particle of particles) {
    particle.x += particle.vx * particle.depth;
    particle.y += particle.vy * particle.depth;
    wrapParticle(particle);

    const driftX = currentX * 48 * particle.depth + Math.cos(time + particle.depth * 4) * 3;
    const driftY = currentY * 32 * particle.depth + Math.sin(time * 0.8 + particle.depth * 5) * 3;
    const x = particle.x + driftX;
    const y = particle.y + driftY;
    const alpha = 0.08 + particle.depth * 0.12;

    context.beginPath();
    context.fillStyle = particle.cyan
      ? `rgba(142, 216, 255, ${alpha})`
      : `rgba(240, 176, 52, ${alpha})`;
    context.arc(x, y, particle.r * particle.depth, 0, Math.PI * 2);
    context.fill();
  }

  for (let index = 0; index < particles.length - 1; index += 2) {
    const a = particles[index];
    const b = particles[index + 1];
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.hypot(dx, dy);

    if (distance > 140) {
      continue;
    }

    context.beginPath();
    context.strokeStyle = `rgba(242, 232, 215, ${0.03 * (1 - distance / 140)})`;
    context.moveTo(a.x + currentX * 20, a.y + currentY * 14);
    context.lineTo(b.x + currentX * 20, b.y + currentY * 14);
    context.stroke();
  }
}

function applyDepthMotion(time) {
  if (reducedMotion) {
    return;
  }

  currentX += (targetX - currentX) * 0.045;
  currentY += (targetY - currentY) * 0.045;

  const floatX = Math.cos(time * 0.6) * 8;
  const floatY = Math.sin(time * 0.8) * 12;

  portrait.style.setProperty("--tx", `${currentX * 34 + floatX}px`);
  portrait.style.setProperty("--ty", `${currentY * 26 + floatY}px`);
  portrait.style.setProperty("--rx", `${-4 - currentY * 14}deg`);
  portrait.style.setProperty("--ry", `${8 + currentX * 18}deg`);
  portrait.style.setProperty("--rz", `${currentX * 3}deg`);

  copy.style.setProperty("--tx", `${-currentX * 18}px`);
  copy.style.setProperty("--ty", `${-currentY * 14}px`);
  copy.style.setProperty("--rx", `${currentY * 4}deg`);

  depthLayers.forEach((layer) => {
    const depth = Number(layer.dataset.depth || 0);
    const tx = currentX * depth * 90 + Math.sin(time * (0.25 + depth)) * depth * 12;
    const ty = currentY * depth * 70 + Math.cos(time * (0.3 + depth)) * depth * 10;

    layer.style.setProperty("--tx", `${tx}px`);
    layer.style.setProperty("--ty", `${ty}px`);
  });
}

function frame(timestamp) {
  const time = timestamp * 0.001;
  applyDepthMotion(time);
  drawField(time);
  window.requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => setPointer(event.clientX, event.clientY));
window.addEventListener("pointerleave", () => {
  targetX = 0;
  targetY = 0;
});

resize();
window.requestAnimationFrame(frame);
