(() => {
  "use strict";

  const root = document.documentElement;
  const heroTrack = document.querySelector(".hero-track");
  const hero = document.getElementById("heroScene");
  const heroStars = document.getElementById("heroStars");
  const lowerStars = document.getElementById("lowerStars");
  const shootingStarLayer = document.getElementById("shootingStarLayer");
  const landmarkStage = document.getElementById("landmarkStage");
  const landmarks = [...document.querySelectorAll(".landmark")];
  const postcardStamp = document.querySelector(".postcard-stamp");
  const revealItems = document.querySelectorAll("[data-reveal]");
  const timelineButtons = document.querySelectorAll("[data-timeline-toggle]");
  const wandSparks = document.getElementById("wandSparks");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const randomBetween = (min, max) => Math.random() * (max - min) + min;
  const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

  function populateStars(container, count, maxTop = 100) {
    if (!container) return;

    const fragment = document.createDocumentFragment();
    container.replaceChildren();

    for (let index = 0; index < count; index += 1) {
      const star = document.createElement("span");
      const size = randomBetween(0.9, index % 12 === 0 ? 3.2 : 2.2);
      const opacity = randomBetween(0.26, 0.9);

      star.className = index % 14 === 0 ? "star star--cross" : "star";
      star.style.left = `${randomBetween(1, 99).toFixed(2)}%`;
      star.style.top = `${randomBetween(0.5, maxTop).toFixed(2)}%`;
      star.style.setProperty("--size", `${size.toFixed(2)}px`);
      star.style.setProperty("--opacity", opacity.toFixed(2));
      star.style.setProperty("--opacity-low", (opacity * 0.48).toFixed(2));
      star.style.setProperty("--opacity-mid", (opacity * 0.7).toFixed(2));
      star.style.setProperty("--duration", `${randomBetween(2.4, 7).toFixed(2)}s`);
      star.style.setProperty("--delay", `${randomBetween(-8, 0).toFixed(2)}s`);
      fragment.appendChild(star);
    }

    container.appendChild(fragment);
  }

  function createStarFields() {
    const viewportArea = window.innerWidth * window.innerHeight;
    const heroCount = clamp(Math.round(viewportArea / 15000), 44, 98);
    populateStars(heroStars, heroCount, 70);

    const lowerHeight = lowerStars?.parentElement?.scrollHeight || window.innerHeight * 3;
    const lowerCount = clamp(Math.round((window.innerWidth * lowerHeight) / 31000), 90, 190);
    populateStars(lowerStars, lowerCount, 99);
  }

  function createWandSparks() {
    if (!wandSparks) return;

    const fragment = document.createDocumentFragment();
    wandSparks.replaceChildren();

    for (let index = 0; index < 42; index += 1) {
      const spark = document.createElement("span");
      spark.className = "wand-spark";
      spark.style.setProperty("--spark-x", `${randomBetween(0, 100).toFixed(2)}%`);
      spark.style.setProperty("--spark-y", `${randomBetween(-46, 46).toFixed(0)}px`);
      spark.style.setProperty("--spark-size", `${randomBetween(1.2, 3.6).toFixed(1)}px`);
      spark.style.setProperty("--spark-delay", `${randomBetween(-5, 0).toFixed(2)}s`);
      spark.style.setProperty("--spark-duration", `${randomBetween(1.8, 4.8).toFixed(2)}s`);
      spark.style.setProperty("--spark-angle", `${randomBetween(-45, 45).toFixed(0)}deg`);
      fragment.appendChild(spark);
    }

    wandSparks.appendChild(fragment);
  }

  let shootingStarTimer;

  function scheduleShootingStar(initial = false) {
    window.clearTimeout(shootingStarTimer);
    if (!shootingStarLayer || reduceMotion.matches || document.hidden) return;

    const wait = initial ? randomBetween(1700, 3900) : randomBetween(7000, 14800);
    shootingStarTimer = window.setTimeout(() => {
      const shootingStar = document.createElement("span");
      const duration = randomBetween(1150, 1750);

      shootingStar.className = "shooting-star";
      shootingStar.style.setProperty("--top", `${randomBetween(3, 42).toFixed(2)}%`);
      shootingStar.style.setProperty("--left", `${randomBetween(-18, 8).toFixed(2)}%`);
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

  function renderLandmarks(progress) {
    const enterScale = window.innerWidth < 760 ? 0.62 : window.innerWidth < 1100 ? 0.82 : 1;

    landmarks.forEach((landmark) => {
      const start = Number.parseFloat(landmark.dataset.start || "0");
      const localProgress = clamp((progress - start) / 0.34, 0, 1);
      const eased = easeOutCubic(localProgress);
      const inverse = 1 - eased;
      const enterX = Number.parseFloat(landmark.dataset.enterX || "0") * enterScale;
      const enterY = Number.parseFloat(landmark.dataset.enterY || "0") * enterScale;
      const enterRotation = Number.parseFloat(landmark.dataset.enterRotation || "0");
      const finalRotation = Number.parseFloat(landmark.dataset.rotation || "0");
      const rotation = finalRotation + enterRotation * inverse;
      const scale = 0.86 + eased * 0.14;

      landmark.style.opacity = String(Math.pow(eased, 0.8));
      landmark.style.transform = `translate3d(${(enterX * inverse).toFixed(2)}px, ${(enterY * inverse).toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });

    if (postcardStamp) {
      const stampProgress = easeOutCubic(clamp((progress - 0.58) / 0.3, 0, 1));
      postcardStamp.style.opacity = String(stampProgress * 0.92);
      postcardStamp.style.transform = `translate3d(0, ${((1 - stampProgress) * 42).toFixed(2)}px, 0) rotate(${(24 - stampProgress * 12).toFixed(2)}deg) scale(${(0.7 + stampProgress * 0.3).toFixed(3)})`;
    }

    if (landmarkStage) {
      const hintOpacity = 1 - clamp((progress - 0.025) / 0.12, 0, 1);
      landmarkStage.style.setProperty("--hint-opacity", hintOpacity.toFixed(3));
    }
  }

  let scrollTicking = false;

  function updateHeroScene() {
    if (!heroTrack) return;

    const rect = heroTrack.getBoundingClientRect();
    const scrollableDistance = Math.max(heroTrack.offsetHeight - window.innerHeight, 1);
    const progress = reduceMotion.matches ? 1 : clamp(-rect.top / scrollableDistance, 0, 1);
    const copyFade = clamp((progress - 0.34) / 0.52, 0, 1);
    const cueFade = clamp(progress / 0.3, 0, 1);

    root.style.setProperty("--hero-copy-y", `${(-30 * copyFade).toFixed(2)}px`);
    root.style.setProperty("--hero-copy-opacity", (1 - copyFade * 0.68).toFixed(3));
    root.style.setProperty("--cue-opacity", (1 - cueFade).toFixed(3));
    root.style.setProperty("--sky-shift", `${(progress * 12).toFixed(2)}px`);

    renderLandmarks(progress);
    scrollTicking = false;
  }

  function onScroll() {
    if (!scrollTicking) {
      scrollTicking = true;
      window.requestAnimationFrame(updateHeroScene);
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
    pointerX = normalizedX * -9;
    pointerY = normalizedY * -6;

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

  function setTimelineOpen(item, isOpen) {
    const button = item.querySelector("[data-timeline-toggle]");
    const card = item.querySelector(".memory-card");
    item.classList.toggle("is-open", isOpen);
    button?.setAttribute("aria-expanded", String(isOpen));
    card?.setAttribute("aria-hidden", String(!isOpen));
  }

  function bindTimeline() {
    timelineButtons.forEach((button) => {
      const item = button.closest(".timeline-item");
      if (!item) return;

      // A tap focuses a button before its click event fires. Remember when the
      // focus handler opened the card so that the same tap does not immediately
      // toggle it closed again.
      let openedOnFocus = false;

      button.addEventListener("focus", () => {
        if (!item.classList.contains("is-open")) {
          document.querySelectorAll(".timeline-item.is-open").forEach((openItem) => {
            if (openItem !== item) setTimelineOpen(openItem, false);
          });
          setTimelineOpen(item, true);
          openedOnFocus = true;
        }
      });

      button.addEventListener("click", () => {
        if (openedOnFocus) {
          openedOnFocus = false;
          return;
        }

        const willOpen = !item.classList.contains("is-open");
        document.querySelectorAll(".timeline-item.is-open").forEach((openItem) => {
          if (openItem !== item) setTimelineOpen(openItem, false);
        });
        setTimelineOpen(item, willOpen);
      });

      item.addEventListener("focusout", () => {
        openedOnFocus = false;
        window.setTimeout(() => {
          if (!item.contains(document.activeElement)) setTimelineOpen(item, false);
        }, 0);
      });
    });

    document.addEventListener("pointerdown", (event) => {
      if (event.target.closest(".timeline-item")) return;
      document.querySelectorAll(".timeline-item.is-open").forEach((item) => setTimelineOpen(item, false));
    });
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
      createStarFields();
      updateHeroScene();
    }, 180);
  }

  createStarFields();
  createWandSparks();
  bindScrollButtons();
  bindContentReveal();
  bindTimeline();
  updateHeroScene();
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
      revealItems.forEach((item) => item.classList.add("is-visible"));
      resetPointerParallax();
    } else {
      scheduleShootingStar(true);
    }
    updateHeroScene();
  });
})();
