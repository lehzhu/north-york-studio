const video = document.getElementById("video");
const volBtn = document.getElementById("volume");
const volOff = document.getElementById("vol-off");
const volOn = document.getElementById("vol-on");

/* ── Parallax ──────────────────────────────────── */

let targetX = 0, targetY = 0;
let curX = 0, curY = 0;
const MAX_SHIFT = 5;
let inputMode = "mouse"; // "mouse", "touch", "gyro"

// Desktop: mouse
window.addEventListener("mousemove", (e) => {
  inputMode = "mouse";
  targetX = (e.clientX / window.innerWidth - 0.5) * 2;
  targetY = (e.clientY / window.innerHeight - 0.5) * 2;
});

window.addEventListener("mouseleave", () => {
  if (inputMode === "mouse") {
    targetX = 0;
    targetY = 0;
  }
});

// Mobile: touch drag
let touchStartX = 0, touchStartY = 0;
let touchBaseX = 0, touchBaseY = 0;

window.addEventListener("touchstart", (e) => {
  if (inputMode === "gyro") return;
  inputMode = "touch";
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
  touchBaseX = targetX;
  touchBaseY = targetY;
}, { passive: true });

window.addEventListener("touchmove", (e) => {
  if (inputMode !== "touch") return;
  const t = e.touches[0];
  const dx = (t.clientX - touchStartX) / window.innerWidth;
  const dy = (t.clientY - touchStartY) / window.innerHeight;
  targetX = Math.max(-1, Math.min(1, touchBaseX + dx * 3));
  targetY = Math.max(-1, Math.min(1, touchBaseY + dy * 3));
}, { passive: true });

// Mobile: gyroscope (opt-in, overrides touch if granted and data is present)
function handleOrientation(e) {
  if (e.gamma === null || e.beta === null) return;
  // Flipped axes + more sensitive (±10° range)
  targetX = Math.max(-1, Math.min(1, -e.gamma / 10));
  targetY = Math.max(-1, Math.min(1, -(e.beta - 45) / 10));
  inputMode = "gyro";
}

function initMotion() {
  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  if (!isTouchDevice) return;

  if (typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function") {
    DeviceOrientationEvent.requestPermission()
      .then((state) => {
        if (state === "granted") {
          window.addEventListener("deviceorientation", handleOrientation);
        }
      })
      .catch(() => {});
  } else if ("DeviceOrientationEvent" in window) {
    window.addEventListener("deviceorientation", handleOrientation);
  }
}

// First interaction: try gyro permission + start video
function onFirstInteraction() {
  initMotion();
  video.play().catch(() => {});
}

window.addEventListener("click", onFirstInteraction, { once: true });
window.addEventListener("touchstart", onFirstInteraction, { once: true });

/* ── Render loop ───────────────────────────────── */

function tick() {
  requestAnimationFrame(tick);

  curX += (targetX - curX) * 0.05;
  curY += (targetY - curY) * 0.05;

  const tx = -curX * MAX_SHIFT;
  const ty = -curY * MAX_SHIFT;

  video.style.transform = `translate(${tx}%, ${ty}%)`;
}

requestAnimationFrame(tick);

/* ── Video autoplay ────────────────────────────── */

video.play().catch(() => {});

/* ── Volume toggle ─────────────────────────────── */

volBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  video.muted = !video.muted;
  volOff.classList.toggle("hidden", !video.muted);
  volOn.classList.toggle("hidden", video.muted);
});
