const homeCanvas = document.getElementById("home-field");
const homeContext = homeCanvas.getContext("2d");
const homeCopy = document.getElementById("home-copy");
const homeForms = document.getElementById("home-forms");
const homeDepth = document.querySelectorAll(".home-forms [data-depth]");
const homeReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let homeWidth = 0;
let homeHeight = 0;
let homeDpr = 1;
let homeTargetX = 0;
let homeTargetY = 0;
let homeCurrentX = 0;
let homeCurrentY = 0;
let homeStars = [];

function resizeHome() {
  homeWidth = window.innerWidth;
  homeHeight = window.innerHeight;
  homeDpr = Math.min(window.devicePixelRatio || 1, 2);

  homeCanvas.width = homeWidth * homeDpr;
  homeCanvas.height = homeHeight * homeDpr;
  homeCanvas.style.width = `${homeWidth}px`;
  homeCanvas.style.height = `${homeHeight}px`;
  homeContext.setTransform(homeDpr, 0, 0, homeDpr, 0, 0);

  const count = Math.max(28, Math.floor(homeWidth / 30));
  homeStars = Array.from({ length: count }, () => ({
    x: Math.random() * homeWidth,
    y: Math.random() * homeHeight,
    r: 0.6 + Math.random() * 1.8,
    speed: 0.08 + Math.random() * 0.16
  }));
}

function setHomePointer(x, y) {
  homeTargetX = x / homeWidth - 0.5;
  homeTargetY = y / homeHeight - 0.5;
}

function drawHomeField(time) {
  homeContext.clearRect(0, 0, homeWidth, homeHeight);

  homeStars.forEach((star, index) => {
    const x = star.x + homeCurrentX * 22 + Math.cos(time * star.speed + index) * 4;
    const y = star.y + homeCurrentY * 14 + Math.sin(time * star.speed + index * 0.4) * 4;

    homeContext.beginPath();
    homeContext.fillStyle = index % 5 === 0
      ? "rgba(143, 191, 228, 0.14)"
      : "rgba(231, 165, 48, 0.12)";
    homeContext.arc(x, y, star.r, 0, Math.PI * 2);
    homeContext.fill();
  });
}

function animateHome(time) {
  if (!homeReduced) {
    homeCurrentX += (homeTargetX - homeCurrentX) * 0.04;
    homeCurrentY += (homeTargetY - homeCurrentY) * 0.04;

    homeCopy.style.setProperty("--tx", `${homeCurrentX * 18}px`);
    homeCopy.style.setProperty("--ty", `${homeCurrentY * 12}px`);
    homeForms.style.setProperty("--tx", `${-homeCurrentX * 14}px`);
    homeForms.style.setProperty("--ty", `${-homeCurrentY * 12}px`);

    homeDepth.forEach((layer) => {
      const depth = Number(layer.dataset.depth || 0);
      const dx = homeCurrentX * depth * 80 + Math.sin(time * (0.35 + depth)) * depth * 16;
      const dy = homeCurrentY * depth * 60 + Math.cos(time * (0.3 + depth)) * depth * 14;
      layer.style.setProperty("--dx", `${dx}px`);
      layer.style.setProperty("--dy", `${dy}px`);
    });
  }

  drawHomeField(time);
  window.requestAnimationFrame((stamp) => animateHome(stamp * 0.001));
}

window.addEventListener("resize", resizeHome);
window.addEventListener("pointermove", (event) => setHomePointer(event.clientX, event.clientY));
window.addEventListener("pointerleave", () => {
  homeTargetX = 0;
  homeTargetY = 0;
});

resizeHome();
window.requestAnimationFrame((stamp) => animateHome(stamp * 0.001));
