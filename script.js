(() => {
  "use strict";

  const root = document.documentElement;
  const hero = document.querySelector(".hero");
  const stars = document.getElementById("stars");
  const shootingStarLayer = document.getElementById("shootingStarLayer");
  const landmarkStage = document.getElementById("landmarkStage");
  const revealItems = document.querySelectorAll("[data-reveal]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const randomBetween = (min, max) => Math.random() * (max - min) + min;

  function createStars() {
    if (!stars) return;

    stars.replaceChildren();
    const viewportArea = window.innerWidth * window.innerHeight;
    const starCount = clamp(Math.round(viewportArea / 14500), 50, 105);
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < starCount; index += 1) {
      const star = document.createElement("span");
      const size = randomBetween(1, index % 11 === 0 ? 3.2 : 2.2);
      const opacity = randomBetween(0.3, 0.92);

      star.className = index % 13 === 0 ? "star star--cross" : "star";
      star.style.left = `${randomBetween(2, 98).toFixed(2)}%`;
      star.style.top = `${randomBetween(1, 71).toFixed(2)}%`;
      star.style.setProperty("--size", `${size.toFixed(2)}px`);
      star.style.setProperty("--opacity", opacity.toFixed(2));
      star.style.setProperty("--opacity-low", (opacity * 0.55).toFixed(2));
      star.style.setProperty("--opacity-mid", (opacity * 0.72).toFixed(2));
      star.style.setProperty("--duration", `${randomBetween(2.3, 6.8).toFixed(2)}s`);
      star.style.setProperty("--delay", `${randomBetween(-7, 0).toFixed(2)}s`);
      fragment.appendChild(star);
    }

    stars.appendChild(fragment);
  }

  let shootingStarTimer;

  function scheduleShootingStar(initial = false) {
    window.clearTimeout(shootingStarTimer);
    if (!shootingStarLayer || reduceMotion.matches || document.hidden) return;

    const wait = initial ? randomBetween(1800, 4200) : randomBetween(6800, 14500);
    shootingStarTimer = window.setTimeout(() => {
      const shootingStar = document.createElement("span");
      const duration = randomBetween(900, 1400);

      shootingStar.className = "shooting-star";
      shootingStar.style.setProperty("--top", `${randomBetween(4, 42).toFixed(2)}%`);
      shootingStar.style.setProperty("--left", `${randomBetween(72, 108).toFixed(2)}%`);
      shootingStar.style.setProperty("--shoot-duration", `${duration.toFixed(0)}ms`);
      shootingStarLayer.appendChild(shootingStar);

      shootingStar.addEventListener(
        "animationend",
        () => {
          shootingStar.remove();
          scheduleShootingStar();
        },
        { once: true },
      );
    }, wait);
  }

  let scrollTicking = false;

  function updateScrollEffects() {
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportHeight = Math.max(window.innerHeight, 1);
    const heroProgress = clamp(scrollY / (viewportHeight * 0.84), 0, 1);

    root.style.setProperty("--hero-copy-shift", `${(-22 * heroProgress).toFixed(2)}px`);
    root.style.setProperty("--hero-copy-opacity", (1 - heroProgress * 0.28).toFixed(3));
    root.style.setProperty("--cue-opacity", (1 - heroProgress * 0.86).toFixed(3));
    root.style.setProperty("--sky-shift", `${(scrollY * 0.065).toFixed(2)}px`);

    if (landmarkStage && (scrollY > 32 || reduceMotion.matches)) {
      landmarkStage.classList.add("is-revealed");
    }

    scrollTicking = false;
  }

  function onScroll() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateScrollEffects);
    }
  }

  let pointerTicking = false;
  let pointerX = 0;
  let pointerY = 0;

  function updatePointerParallax() {
    root.style.setProperty("--pointer-x", `${pointerX.toFixed(2)}px`);
    root.style.setProperty("--pointer-y", `${pointerY.toFixed(2)}px`);
    pointerTicking = false;
  }

  function onPointerMove(event) {
    if (reduceMotion.matches || !hero || window.innerWidth < 760) return;

    const normalizedX = event.clientX / window.innerWidth - 0.5;
    const normalizedY = event.clientY / window.innerHeight - 0.5;
    pointerX = normalizedX * -10;
    pointerY = normalizedY * -7;

    if (!pointerTicking) {
      pointerTicking = true;
      window.requestAnimationFrame(updatePointerParallax);
    }
  }

  function resetPointerParallax() {
    pointerX = 0;
    pointerY = 0;
    updatePointerParallax();
  }

  function bindScrollButtons() {
    document.querySelectorAll("[data-scroll-to]").forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-scroll-to");
        const target = targetId ? document.getElementById(targetId) : null;
        target?.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",
          block: "start",
        });
      });
    });
  }

  function bindContentReveal() {
    if (!revealItems.length) return;

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -7% 0px" },
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      window.clearTimeout(shootingStarTimer);
    } else {
      scheduleShootingStar(true);
    }
  }

  let resizeTimer;
  function onResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      createStars();
      updateScrollEffects();
    }, 180);
  }

  createStars();
  bindScrollButtons();
  bindContentReveal();
  updateScrollEffects();
  scheduleShootingStar(true);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", resetPointerParallax, { passive: true });
  document.addEventListener("visibilitychange", handleVisibilityChange);

  reduceMotion.addEventListener?.("change", () => {
    if (reduceMotion.matches) {
      window.clearTimeout(shootingStarTimer);
      shootingStarLayer?.replaceChildren();
      landmarkStage?.classList.add("is-revealed");
      revealItems.forEach((item) => item.classList.add("is-visible"));
      resetPointerParallax();
    } else {
      scheduleShootingStar(true);
    }
  });
})();
