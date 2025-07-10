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
const explosionSheet = {
  img: new Image(),
  frameW: 28,              // ширина кадру в листі
  frameH: 28,              // висота кадру
  frames: 0                // кількість кадрів (визначимо після onload)
};
explosionSheet.img.src = "images/effects/explosion_96.png";
explosionSheet.img.onload = () => {
  explosionSheet.frames = explosionSheet.img.height / explosionSheet.frameH;
};

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
const explosions = []; // активні вибухи

let score = 0;
let bgFarY = 0;

// === Сенсорне керування ===
let lastTouch = null;
let stopThreshold = 0.5;

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

// === Допоміжні функції ===
function spawnExplosion(cx, cy) {
  explosions.push({
    x: cx - explosionSheet.frameW / 2,
    y: cy - explosionSheet.frameH / 2,
    frame: 0,
    frameTimer: 0
  });
}

// === Головний цикл ===
let lastTime = performance.now();

function gameLoop(now) {
  const deltaTime = (now - lastTime) / 1000;
  lastTime = now;

  update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Рух гравця
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
  player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));

  // Фон
  bgFarY += 100 * dt;
  if (bgFarY > canvas.height) bgFarY = 0;

  // Кулі
  bullets.forEach((b, i) => {
    b.y -= 400 * dt;
    if (b.y < -10) bullets.splice(i, 1);
  });

  // Вороги
  enemies.forEach((e, i) => {
    e.y += e.speed * dt;
    if (e.y > canvas.height + e.height) enemies.splice(i, 1);

    // --- Колізія з гравцем ---
    const paddingX = 10;
    const paddingY = 6;
    if (
      e.x + paddingX < player.x + player.width / 2 &&
      e.x + e.width - paddingX > player.x - player.width / 2 &&
      e.y + paddingY < player.y + player.height / 2 &&
      e.y + e.height - paddingY > player.y - player.height / 2
    ) {
      restartGame();
    }

    // --- Перевірка попадання куль ---
    bullets.forEach((b, j) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        e.hp--;
        bullets.splice(j, 1);
        if (e.hp <= 0) {
          // Додаємо вибух
          spawnExplosion(e.x + e.width / 2, e.y + e.height / 2);
          enemies.splice(i, 1);
          score++;
        }
      }
    });
  });

  // --- Оновлення вибухів ---
  explosions.forEach((ex, idx) => {
    const frameDuration = 0.04; // сек для одного кадру (~25 FPS)
    ex.frameTimer += dt;
    if (ex.frameTimer >= frameDuration) {
      ex.frame++;
      ex.frameTimer = 0;
      if (ex.frame >= explosionSheet.frames) {
        explosions.splice(idx, 1);
      }
    }
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Фон (два шари для безшовного скролу)
  ctx.drawImage(backgroundFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);

  // Гравець
  ctx.drawImage(playerImg, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

  // Кулі
  bullets.forEach(b => {
    ctx.fillStyle = "white";
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  // Вороги + HP бар
  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);

    if (e.hp < e.maxHp) {
      const segmentCount = e.maxHp;
      const spacing = 2;
      const barWidth = e.width;
      const barHeight = 3;
      const segmentWidth = (barWidth - (segmentCount - 1) * spacing) / segmentCount;

      for (let i = 0; i < segmentCount; i++) {
        const filled = i < e.hp;
        ctx.fillStyle = filled ? "red" : "rgba(100, 100, 100, 0.4)";
        ctx.beginPath();
        ctx.roundRect(
          e.x + i * (segmentWidth + spacing),
          e.y - 8,
          segmentWidth,
          barHeight,
          [2]
        );
        ctx.fill();
      }
    }
  });

  // --- Малюємо вибухи поверх усього ---
  explosions.forEach(ex => {
    ctx.drawImage(
      explosionSheet.img,
      0,                                // srcX (кадри вертикально)
      ex.frame * explosionSheet.frameH,  // srcY
      explosionSheet.frameW,
      explosionSheet.frameH,
      ex.x,
      ex.y,
      explosionSheet.frameW,
      explosionSheet.frameH
    );
  });

  // Рахунок
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// === Спавн куль та ворогів ===
setInterval(() => {
  bullets.push({
    x: player.x - 2,
    y: player.y - player.height / 2,
    width: 4,
    height: 10
  });
}, 250);

setInterval(() => {
  const eWidth = 50;
  enemies.push({
    x: Math.random() * (canvas.width - eWidth),
    y: -60,
    width: eWidth,
    height: 50,
    speed: 120 + Math.random() * 80,
    hp: 3,
    maxHp: 3
  });
}, 1000);

// === Перезапуск гри ===
function restartGame() {
  score = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
  bullets.length = 0;
  enemies.length = 0;
  explosions.length = 0;
}

// === Дочекаємося повного завантаження ресурсів ===
Promise.all([
  new Promise(res => playerImg.onload = res),
  new Promise(res => backgroundFar.onload = res),
  new Promise(res => enemyImg.onload = res),
  new Promise(res => explosionSheet.img.onload = res)
]).then(() => requestAnimationFrame(gameLoop));
