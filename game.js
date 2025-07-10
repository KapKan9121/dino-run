// === Canvas ініціалізація ===
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// === Завантаження зображень ===
const playerImg = new Image();
playerImg.src = "images/player/player.png";

const backgroundFar = new Image();
backgroundFar.src = "images/fon/layer_far.png";

const enemyImg = new Image();
enemyImg.src = "images/enemy/enemy.png";

// --- СПРАЙТ вибуху ---
// --- СПРАЙТ вибуху ---
const explosionSheet = {
  img: new Image(),
  frameW: 28,              // ширина кадру в спрайті
  frameH: 28,              // висота кадру
  scale: 2,                // збільшення (2 ⇒ 56×56)
  frames: 0                // буде обчислено після onload
};
explosionSheet.img.src = "images/effects/explosion_96.png";

// === Ігрові об'єкти ===
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  width: 60,
  height: 60,
  speedX: 0,
  speedY: 0
};

const bullets = [];
const enemies = [];
const explosions = [];

let score = 0;
let bgFarY = 0;

// === Сенсорне керування ===
let lastTouch = null;
const stopThreshold = 0.5;

canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  lastTouch = { x: t.clientX, y: t.clientY, time: performance.now() };
  player.speedX = 0;
  player.speedY = 0;
});

canvas.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  const now = performance.now();
  if (!lastTouch) return;

  const dx = t.clientX - lastTouch.x;
  const dy = t.clientY - lastTouch.y;
  const dt = now - lastTouch.time;
  if (dt < 1) return;

  const pxPerFrameX = dx / (dt / 16.66);
  const pxPerFrameY = dy / (dt / 16.66);
  const speed = Math.sqrt(pxPerFrameX ** 2 + pxPerFrameY ** 2);

  player.speedX = speed < stopThreshold ? 0 : pxPerFrameX;
  player.speedY = speed < stopThreshold ? 0 : pxPerFrameY;

  lastTouch = { x: t.clientX, y: t.clientY, time: now };
});

canvas.addEventListener("touchend", () => {
  lastTouch = null;
  player.speedX = 0;
  player.speedY = 0;
});

// === Допоміжна функція для спавну вибуху ===
function spawnExplosion(cx, cy) {
  const w = explosionSheet.frameW * explosionSheet.scale;
  const h = explosionSheet.frameH * explosionSheet.scale;
  explosions.push({
    x: cx - w / 2,
    y: cy - h / 2,
    frame: 0,
    frameTimer: 0,
    destW: w,
    destH: h
  });
}
}

// === Головний цикл ===
let lastTime = performance.now();
function gameLoop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Рух гравця
  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x + player.speedX));
  player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y + player.speedY));

  // Фон
  bgFarY = (bgFarY + 100 * dt) % canvas.height;

  // Кулі
  bullets.forEach((b, i) => {
    b.y -= 400 * dt;
    if (b.y < -10) bullets.splice(i, 1);
  });

  // Вороги
  enemies.forEach((e, i) => {
    e.y += e.speed * dt;
    if (e.y > canvas.height + e.height) enemies.splice(i, 1);

    // === Колізія з гравцем ===
    const padX = 10, padY = 6;
    if (
      e.x + padX < player.x + player.width / 2 &&
      e.x + e.width - padX > player.x - player.width / 2 &&
      e.y + padY < player.y + player.height / 2 &&
      e.y + e.height - padY > player.y - player.height / 2
    ) restartGame();

    // === Попадання кулі ===
    bullets.forEach((b, j) => {
      if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + b.height > e.y) {
        e.hp--; bullets.splice(j, 1);
        if (e.hp <= 0) {
          spawnExplosion(e.x + e.width / 2, e.y + e.height / 2);
          enemies.splice(i, 1);
          score++;
        }
      }
    });
  });

  // === Анімація вибухів ===
  const frameDuration = 0.03; // швидше (≈33 FPS)
  for (let k = explosions.length - 1; k >= 0; k--) {
    const ex = explosions[k];
    ex.frameTimer += dt;
    if (ex.frameTimer >= frameDuration) {
      ex.frame++; ex.frameTimer = 0;
      if (ex.frame >= explosionSheet.frames) explosions.splice(k, 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Фон (два зображення для безшовного скролу)
  ctx.drawImage(backgroundFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);

  // Гравець
  ctx.drawImage(playerImg, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

  // Кулі
  ctx.fillStyle = "white";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  // Вороги
  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);

    // HP бар
    if (e.hp < e.maxHp) {
      const segments = e.maxHp, gap = 2, barH = 3, segW = (e.width - (segments - 1) * gap) / segments;
      for (let s = 0; s < segments; s++) {
        ctx.fillStyle = s < e.hp ? "red" : "rgba(80,80,80,0.4)";
        ctx.beginPath();
        ctx.roundRect(e.x + s * (segW + gap), e.y - 8, segW, barH, [2]);
        ctx.fill();
      }
    }
  });

  // Вибухи
  explosions.forEach(ex => {
    ctx.drawImage(
      explosionSheet.img,
      0,
      ex.frame * explosionSheet.frameH,
      explosionSheet.frameW,
      explosionSheet.frameH,
      ex.x,
      ex.y,
      ex.destW,
      ex.destH
    );
  });

  // Рахунок(`Score: ${score}`, 10, 30);
}

// === Спавн куль та ворогів ===
setInterval(() => bullets.push({ x: player.x - 2, y: player.y - player.height / 2, width: 4, height: 10 }), 250);

setInterval(() => {
  const w = 50;
  enemies.push({ x: Math.random() * (canvas.width - w), y: -60, width: w, height: 50, speed: 120 + Math.random() * 80, hp: 3, maxHp: 3 });
}, 1000);

function restartGame() {
  score = 0; bullets.length = 0; enemies.length = 0; explosions.length = 0;
  player.x = canvas.width / 2; player.y = canvas.height * 0.75;
}

// === Завантаження ресурсів ===
Promise.all([
  new Promise(r => playerImg.onload = r),
  new Promise(r => backgroundFar.onload = r),
  new Promise(r => enemyImg.onload = r),
  new Promise(r => {
    explosionSheet.img.onload = () => {
      // автоматично підлаштовуємося під будь‑який вертикальний спрайт
      explosionSheet.frameW = explosionSheet.img.width;          // ширина кадру = ширина зображення
      explosionSheet.frameH = explosionSheet.img.width;          // кадри квадратні, тож висоту беремо = ширині
      explosionSheet.frames = Math.floor(explosionSheet.img.height / explosionSheet.frameH);
      r();
    };
  });
    };
  })
]).then(() => requestAnimationFrame(gameLoop));
