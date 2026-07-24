document.getElementById("year").textContent = new Date().getFullYear();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal").forEach((el) => {
  revealObserver.observe(el);
});

document.querySelectorAll("video").forEach((video) => {
  video.addEventListener("error", () => {
    video.style.display = "none";
  });
});

const hero = document.querySelector(".hero");
const heroVideo = document.querySelector(".hero-video");
const heroCaption = document.querySelector(".hero-caption");

function updateHero() {
  if (!hero || !heroVideo || !heroCaption) return;

  const progress = Math.min(Math.max(window.scrollY / hero.offsetHeight, 0), 1);

  heroVideo.style.transform = `scale(${1 + progress * 0.045})`;
  heroCaption.style.opacity = String(Math.max(1 - progress * 1.65, 0));
  heroCaption.style.transform = `translateY(${progress * 28}px)`;
}

window.addEventListener("scroll", updateHero, { passive: true });
window.addEventListener("resize", updateHero);
updateHero();
