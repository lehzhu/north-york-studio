const video = document.getElementById("video");
const volBtn = document.getElementById("volume");
const volOff = document.getElementById("vol-off");
const volOn = document.getElementById("vol-on");

/* ── Parallax: shift the oversize video based on cursor ── */

let mouseX = 0, mouseY = 0;
let curX = 0, curY = 0;
// Max shift in % — video is oversized by 15%, so we can shift up to ~7.5%
const MAX_SHIFT = 5;

window.addEventListener("mousemove", (e) => {
  // Normalize to -1..1
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener("mouseleave", () => {
  mouseX = 0;
  mouseY = 0;
});

function tick() {
  requestAnimationFrame(tick);

  // Smooth interpolation
  curX += (mouseX - curX) * 0.05;
  curY += (mouseY - curY) * 0.05;

  // Shift video in the opposite direction of cursor
  // (cursor goes right → video shifts left → reveals right edge)
  const tx = -curX * MAX_SHIFT;
  const ty = -curY * MAX_SHIFT;

  video.style.transform = `translate(${tx}%, ${ty}%)`;
}

requestAnimationFrame(tick);

/* ── Video autoplay ────────────────────────────── */

video.play().catch(() => {});

// Fallback for autoplay restrictions
function startVideo() {
  video.play().catch(() => {});
}
window.addEventListener("click", startVideo, { once: true });
window.addEventListener("touchstart", startVideo, { once: true });

/* ── Volume toggle ─────────────────────────────── */

volBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  video.muted = !video.muted;
  volOff.classList.toggle("hidden", !video.muted);
  volOn.classList.toggle("hidden", video.muted);
});
