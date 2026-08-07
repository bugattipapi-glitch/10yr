(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const board = document.getElementById("gameBoard");
  const status = document.getElementById("gameStatus");
  const bumpCount = document.getElementById("bumpCount");
  const startOverlay = document.getElementById("startOverlay");
  const startButton = document.getElementById("startGame");
  const winOverlay = document.getElementById("winOverlay");
  const playAgain = document.getElementById("playAgain");
  const collisionFlash = document.getElementById("collisionFlash");
  const gameMusic = document.getElementById("gameMusic");
  const musicToggle = document.getElementById("musicToggle");
  const musicLabel = document.getElementById("musicLabel");
  const controls = [...document.querySelectorAll("[data-direction]")];

  if (!(canvas instanceof HTMLCanvasElement) || !board) return;

  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const regions = {
    leftDestinationEnd: 0.2,
    leftSidewalkEnd: 0.28,
    roadStart: 0.28,
    roadEnd: 0.72,
    rightSidewalkEnd: 0.8,
  };

  const player = {
    x: 0.245,
    y: 0.67,
    startX: 0.245,
    startY: 0.67,
    widthRatio: 0.09,
    minWidth: 58,
    aspect: 1010 / 407,
    hitboxX: 0.14,
    hitboxY: 0.28,
  };

  const spriteSources = {
    jeep: "assets/game/jeep-sprite.png",
    roadrunner: "assets/game/roadrunner-sprite.png",
    tornado: "assets/game/tornado-sprite.png",
    hotdog: "assets/game/hotdog.svg",
  };

  const sprites = {};
  let state = "ready";
  let bumps = 0;
  let collisionCooldownUntil = 0;
  let previousTime = performance.now();
  let pausedAt = 0;
  let repeatDelay = 0;
  let repeatInterval = 0;
  let suppressControlClick = false;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let musicMuted = false;
  let resumeMusicWhenVisible = false;

  const laneCenters = [
    regions.roadStart + (regions.roadEnd - regions.roadStart) / 6,
    regions.roadStart + (regions.roadEnd - regions.roadStart) / 2,
    regions.roadEnd - (regions.roadEnd - regions.roadStart) / 6,
  ];

  const obstacles = [
    {
      type: "roadrunner",
      lane: 0,
      y: 0.15,
      speed: 0.255,
      widthRatio: 0.08,
      minWidth: 52,
      aspect: 601 / 293,
      hitboxX: 0.18,
      hitboxY: 0.17,
      phase: 0.1,
    },
    {
      type: "roadrunner",
      lane: 0,
      y: 0.72,
      speed: 0.215,
      widthRatio: 0.08,
      minWidth: 52,
      aspect: 601 / 293,
      hitboxX: 0.18,
      hitboxY: 0.17,
      phase: 1.2,
    },
    {
      type: "tornado",
      lane: 1,
      y: 0.34,
      speed: 0.185,
      widthRatio: 0.056,
      minWidth: 44,
      aspect: 533 / 565,
      hitboxX: 0.2,
      hitboxY: 0.12,
      phase: 2.1,
    },
    {
      type: "tornado",
      lane: 1,
      y: 0.88,
      speed: 0.225,
      widthRatio: 0.056,
      minWidth: 44,
      aspect: 533 / 565,
      hitboxX: 0.2,
      hitboxY: 0.12,
      phase: 0.6,
    },
    {
      type: "hotdog",
      lane: 2,
      y: 0.06,
      speed: 0.285,
      widthRatio: 0.071,
      minWidth: 40,
      aspect: 126 / 72,
      hitboxX: 0.14,
      hitboxY: 0.22,
      phase: 2.8,
    },
    {
      type: "hotdog",
      lane: 2,
      y: 0.57,
      speed: 0.245,
      widthRatio: 0.071,
      minWidth: 40,
      aspect: 126 / 72,
      hitboxX: 0.14,
      hitboxY: 0.22,
      phase: 1.7,
    },
  ];

  function loadSprite(name, source) {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
    sprites[name] = image;
    image.addEventListener("load", drawFrame, { once: true });
  }

  Object.entries(spriteSources).forEach(([name, source]) => loadSprite(name, source));

  function setStatus(message) {
    if (status) status.textContent = message;
  }

  function setBumps(value) {
    bumps = value;
    if (bumpCount) bumpCount.textContent = String(value);
  }

  function updateMusicButton(isPlaying) {
    musicToggle?.setAttribute("aria-pressed", String(isPlaying));
    if (musicLabel) musicLabel.textContent = isPlaying ? "Music: on" : "Music: off";
  }

  async function startMusic() {
    if (!(gameMusic instanceof HTMLAudioElement) || musicMuted) return;

    gameMusic.volume = 0.28;
    try {
      await gameMusic.play();
      updateMusicButton(true);
    } catch {
      // Autoplay policies can still vary. The visible control remains available.
      updateMusicButton(false);
    }
  }

  function stopMusic(markMuted = false) {
    if (!(gameMusic instanceof HTMLAudioElement)) return;
    gameMusic.pause();
    if (markMuted) musicMuted = true;
    updateMusicButton(false);
  }

  function toggleMusic() {
    if (!(gameMusic instanceof HTMLAudioElement)) return;

    if (gameMusic.paused || musicMuted) {
      musicMuted = false;
      startMusic();
    } else {
      stopMusic(true);
    }
  }

  function resetPlayer() {
    player.x = player.startX;
    player.y = player.startY;
  }

  function resetObstacles() {
    // Begin with two staggered obstacles already visible in every lane.
    const starts = [0.15, 0.72, 0.34, 0.88, 0.06, 0.57];
    obstacles.forEach((obstacle, index) => {
      obstacle.y = starts[index];
    });
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFrame();
  }

  function roundedRectPath(ctx, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBoard() {
    context.clearRect(0, 0, width, height);

    const sandGradient = context.createLinearGradient(0, 0, 0, height);
    sandGradient.addColorStop(0, "#c8a779");
    sandGradient.addColorStop(1, "#9b7952");
    context.fillStyle = sandGradient;
    context.fillRect(0, 0, width, height);

    context.save();
    context.globalAlpha = 0.18;
    context.fillStyle = "#654b3c";
    const dotGap = Math.max(14, width / 58);
    for (let x = 5; x < width; x += dotGap) {
      for (let y = 7; y < height; y += dotGap) {
        const jitter = ((x * 17 + y * 11) % 9) - 4;
        context.beginPath();
        context.arc(x + jitter, y + jitter * 0.45, 0.8, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.restore();

    const roadX = width * regions.roadStart;
    const roadWidth = width * (regions.roadEnd - regions.roadStart);
    const roadGradient = context.createLinearGradient(roadX, 0, roadX + roadWidth, 0);
    roadGradient.addColorStop(0, "#17181d");
    roadGradient.addColorStop(0.12, "#292a30");
    roadGradient.addColorStop(0.88, "#292a30");
    roadGradient.addColorStop(1, "#17181d");
    context.fillStyle = roadGradient;
    context.fillRect(roadX, 0, roadWidth, height);

    const sidewalkWidth = width * (regions.leftSidewalkEnd - regions.leftDestinationEnd);
    drawSidewalk(width * regions.leftDestinationEnd, sidewalkWidth);
    drawSidewalk(width * regions.roadEnd, sidewalkWidth);

    context.save();
    context.strokeStyle = "rgba(244, 215, 133, 0.78)";
    context.shadowColor = "rgba(244, 215, 133, 0.24)";
    context.shadowBlur = 7;
    context.lineWidth = Math.max(2, width * 0.0022);
    context.beginPath();
    context.moveTo(roadX, 0);
    context.lineTo(roadX, height);
    context.moveTo(roadX + roadWidth, 0);
    context.lineTo(roadX + roadWidth, height);
    context.stroke();
    context.restore();

    context.save();
    context.strokeStyle = "rgba(247, 240, 220, 0.7)";
    context.lineWidth = Math.max(1.5, width * 0.0016);
    context.setLineDash([Math.max(18, height * 0.055), Math.max(18, height * 0.052)]);
    context.lineDashOffset = -((performance.now() * 0.016) % Math.max(36, height * 0.107));
    for (let index = 1; index <= 2; index += 1) {
      const x = roadX + (roadWidth * index) / 3;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    context.restore();

    drawBoardLabels(roadX, roadWidth, sidewalkWidth);
  }

  function drawSidewalk(x, sidewalkWidth) {
    const gradient = context.createLinearGradient(x, 0, x + sidewalkWidth, 0);
    gradient.addColorStop(0, "#9d9182");
    gradient.addColorStop(0.5, "#c4b9a8");
    gradient.addColorStop(1, "#9b8f80");
    context.fillStyle = gradient;
    context.fillRect(x, 0, sidewalkWidth, height);

    context.save();
    context.strokeStyle = "rgba(72, 64, 57, 0.35)";
    context.lineWidth = 1;
    const slab = Math.max(42, height / 9);
    for (let y = 0; y <= height; y += slab) {
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + sidewalkWidth, y);
      context.stroke();
    }
    context.restore();
  }

  function drawBoardLabels(roadX, roadWidth, sidewalkWidth) {
    context.save();
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = `800 ${Math.max(7, Math.min(11, width * 0.008))}px Nunito Sans, sans-serif`;
    context.fillStyle = "rgba(255, 255, 255, 0.15)";

    ["ROADRUNNERS", "TORNADOES", "HOT DOGS"].forEach((label, index) => {
      const x = roadX + roadWidth * ((index + 0.5) / 3);
      context.fillText(label, x, height - Math.max(18, height * 0.035));
    });

    context.save();
    context.translate(width * regions.leftDestinationEnd + sidewalkWidth / 2, height * 0.13);
    context.rotate(Math.PI / 2);
    context.fillStyle = "rgba(47, 42, 38, 0.45)";
    context.fillText("SAFE", 0, 0);
    context.restore();

    context.save();
    context.translate(width * regions.roadEnd + sidewalkWidth / 2, height * 0.13);
    context.rotate(Math.PI / 2);
    context.fillStyle = "rgba(47, 42, 38, 0.45)";
    context.fillText("SAFE", 0, 0);
    context.restore();

    context.restore();
  }

  function entityMetrics(entity) {
    const entityWidth = Math.max(entity.minWidth || 34, width * entity.widthRatio);
    return {
      x: entity.x * width,
      y: entity.y * height,
      width: entityWidth,
      height: entityWidth / entity.aspect,
      hitboxX: entity.hitboxX ?? 0.18,
      hitboxY: entity.hitboxY ?? 0.18,
    };
  }

  function obstacleMetrics(obstacle) {
    return entityMetrics({ ...obstacle, x: laneCenters[obstacle.lane] });
  }

  function drawImageEntity(image, metrics, rotation = 0, alpha = 1) {
    context.save();
    context.translate(metrics.x, metrics.y);
    context.rotate(rotation);
    context.globalAlpha = alpha;
    context.shadowColor = "rgba(0, 0, 0, 0.4)";
    context.shadowBlur = Math.max(5, width * 0.006);
    context.shadowOffsetY = Math.max(3, height * 0.008);

    if (image?.complete && image.naturalWidth > 0) {
      context.drawImage(image, -metrics.width / 2, -metrics.height / 2, metrics.width, metrics.height);
    } else {
      context.fillStyle = "#f0ce86";
      roundedRectPath(context, -metrics.width / 2, -metrics.height / 2, metrics.width, metrics.height, 8);
      context.fill();
    }

    context.restore();
  }

  function drawObstacles(now) {
    obstacles.forEach((obstacle) => {
      const metrics = obstacleMetrics(obstacle);
      const wobble = Math.sin(now * 0.003 + obstacle.phase);
      let rotation = wobble * 0.035;
      if (obstacle.type === "tornado") rotation = wobble * 0.055;
      if (obstacle.type === "hotdog") rotation = wobble * 0.09;
      drawImageEntity(sprites[obstacle.type], metrics, rotation);
    });
  }

  function drawPlayer() {
    const metrics = entityMetrics(player);
    const isCoolingDown = performance.now() < collisionCooldownUntil;
    const alpha = isCoolingDown && Math.floor(performance.now() / 90) % 2 === 0 ? 0.42 : 1;
    drawImageEntity(sprites.jeep, metrics, 0, alpha);
  }

  function drawFrame(now = performance.now()) {
    if (!width || !height) return;
    drawBoard();
    drawObstacles(now);
    drawPlayer();
  }

  function intersects(playerMetrics, obstacleMetricsValue) {
    const playerPadX = playerMetrics.width * playerMetrics.hitboxX;
    const playerPadY = playerMetrics.height * playerMetrics.hitboxY;
    const obstaclePadX = obstacleMetricsValue.width * obstacleMetricsValue.hitboxX;
    const obstaclePadY = obstacleMetricsValue.height * obstacleMetricsValue.hitboxY;

    return (
      playerMetrics.x - playerMetrics.width / 2 + playerPadX <
        obstacleMetricsValue.x + obstacleMetricsValue.width / 2 - obstaclePadX &&
      playerMetrics.x + playerMetrics.width / 2 - playerPadX >
        obstacleMetricsValue.x - obstacleMetricsValue.width / 2 + obstaclePadX &&
      playerMetrics.y - playerMetrics.height / 2 + playerPadY <
        obstacleMetricsValue.y + obstacleMetricsValue.height / 2 - obstaclePadY &&
      playerMetrics.y + playerMetrics.height / 2 - playerPadY >
        obstacleMetricsValue.y - obstacleMetricsValue.height / 2 + obstaclePadY
    );
  }

  function handleCollision(type) {
    const now = performance.now();
    if (now < collisionCooldownUntil) return;

    collisionCooldownUntil = now + 900;
    setBumps(bumps + 1);
    resetPlayer();

    const messages = {
      roadrunner: "Roadrunner says nope. Back to Valentine.",
      tornado: "A tiny tornado reset the itinerary.",
      hotdog: "Taken out by a flying hot dog. Honestly, fair.",
    };
    setStatus(messages[type] || "Back to Valentine.");

    collisionFlash?.classList.remove("is-active");
    void collisionFlash?.offsetWidth;
    collisionFlash?.classList.add("is-active");
  }

  function updateObstacles(deltaSeconds) {
    const motionFactor = reducedMotion.matches ? 0.63 : 1;

    obstacles.forEach((obstacle) => {
      obstacle.y += obstacle.speed * motionFactor * deltaSeconds;
      if (obstacle.y > 1.18) {
        obstacle.y = -0.16 - Math.random() * 0.46;
      }
    });
  }

  function testCollisions() {
    if (performance.now() < collisionCooldownUntil) return;
    const playerBox = entityMetrics(player);

    for (const obstacle of obstacles) {
      if (intersects(playerBox, obstacleMetrics(obstacle))) {
        handleCollision(obstacle.type);
        break;
      }
    }
  }

  function showStartOverlay(show) {
    if (!startOverlay) return;
    startOverlay.hidden = !show;
  }

  function showWinOverlay(show) {
    if (!winOverlay) return;
    winOverlay.hidden = !show;
  }

  function startGame() {
    state = "playing";
    collisionCooldownUntil = 0;
    setBumps(0);
    resetPlayer();
    resetObstacles();
    showStartOverlay(false);
    showWinOverlay(false);
    setStatus("Crossing in progress. Watch the lanes.");
    startMusic();
    canvas.focus({ preventScroll: true });
    previousTime = performance.now();
  }

  function winGame() {
    state = "won";
    setStatus("Made it across. Miraculously.");
    showWinOverlay(true);
  }

  function movePlayer(direction) {
    if (state === "ready") startGame();
    if (state !== "playing") return;

    const xStep = width < 560 ? 0.052 : 0.036;
    const yStep = height > width ? 0.045 : 0.062;

    if (direction === "up") player.y -= yStep;
    if (direction === "down") player.y += yStep;
    if (direction === "left") player.x -= xStep;
    if (direction === "right") player.x += xStep;

    player.x = Math.min(Math.max(player.x, 0.225), 0.775);
    player.y = Math.min(Math.max(player.y, 0.07), 0.93);

    if (player.x >= 0.755) winGame();
    drawFrame();
  }

  const keyDirections = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };

  function handleKeydown(event) {
    if ((event.key === "Enter" || event.key === " ") && state !== "playing") {
      event.preventDefault();
      startGame();
      return;
    }

    const direction = keyDirections[event.key];
    if (!direction) return;
    event.preventDefault();
    movePlayer(direction);
  }

  function stopControlRepeat() {
    window.clearTimeout(repeatDelay);
    window.clearInterval(repeatInterval);
    repeatDelay = 0;
    repeatInterval = 0;
    controls.forEach((control) => control.classList.remove("is-pressed"));
  }

  controls.forEach((control) => {
    const direction = control.dataset.direction;

    control.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      suppressControlClick = true;
      stopControlRepeat();
      control.classList.add("is-pressed");
      movePlayer(direction);
      repeatDelay = window.setTimeout(() => {
        repeatInterval = window.setInterval(() => movePlayer(direction), 105);
      }, 270);
    });

    control.addEventListener("click", (event) => {
      if (suppressControlClick) {
        suppressControlClick = false;
        event.preventDefault();
        return;
      }
      movePlayer(direction);
    });
  });

  function loop(now) {
    const deltaSeconds = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;

    if (state === "playing" && !document.hidden) {
      updateObstacles(deltaSeconds);
      testCollisions();
    }

    drawFrame(now);
    window.requestAnimationFrame(loop);
  }

  const resizeObserver = new ResizeObserver(resizeCanvas);
  resizeObserver.observe(board);

  window.addEventListener("keydown", handleKeydown, { passive: false });
  window.addEventListener("pointerup", stopControlRepeat);
  window.addEventListener("pointercancel", stopControlRepeat);
  window.addEventListener("blur", stopControlRepeat);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pausedAt = performance.now();
      stopControlRepeat();
      resumeMusicWhenVisible = gameMusic instanceof HTMLAudioElement && !gameMusic.paused && !musicMuted;
      if (resumeMusicWhenVisible) stopMusic(false);
    } else {
      previousTime += performance.now() - pausedAt;
      if (resumeMusicWhenVisible) startMusic();
      resumeMusicWhenVisible = false;
    }
  });

  startButton?.addEventListener("click", startGame);
  playAgain?.addEventListener("click", startGame);
  musicToggle?.addEventListener("click", toggleMusic);

  if (gameMusic instanceof HTMLAudioElement) gameMusic.volume = 0.28;
  updateMusicButton(false);
  resizeCanvas();
  window.requestAnimationFrame(loop);
})();
