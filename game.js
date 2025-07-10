const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// === Зображення ===
const playerImg = new Image();
playerImg.src = "images/player/player.png";

const bgImg = new Image();
bgImg.src = "images/fon/layer_far.png";

const enemyImg = new Image();
enemyImg.src = "images/enemy/enemy.png";

// === Гравець ===
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.8,
  w: 60,
  h: 60,
  speedX: 0,
  speedY: 0,
};

// === Кулі ===
const bullets = [];

// === Вороги ===
const enemies = [];
let killCount = 0;
let spawnTimer = 0;

// === Фон ===
let bgY = 0;

// === Контроль дотику ===
let lastTouch = null;
let stopThreshold = 0.5;

// === FPS / DeltaTime ===
let lastTime = performance.now();

// === Події ===
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  lastTouch = { x: t.clientX, y: t.clientY, time: performance.now() };
});

canvas.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  const now = performance.now();
  const dx = t.clientX - lastTouch.x;
  const dy = t.clientY - lastTouch.y;
  const dt = now - lastTouch.time;

  const pxPerFrameX = dx / (dt / 16.66);
  const pxPerFrameY = dy / (dt / 16.66);

  const speed = Math.sqrt(pxPerFrameX ** 2 + pxPerFrameY ** 2);
  if (speed < stopThreshold) {
    player.speedX = 0;
    player.speedY = 0;
  } else {
    player.speedX = pxPerFrameX;
    player.speedY = pxPerFrameY;
  }

  lastTouch = { x: t.clientX, y: t.clientY, time: now };
});

canvas.addEventListener("touchend", () => {
  player.speedX = 0;
  player.speedY = 0;
  lastTouch = null;
});

// === Функції ===

function spawnEnemy() {
  const x = Math.random() * (canvas.width - 50);
  enemies.push({
    x,
    y: -60,
    w: 50,
    h: 50,
    hp: 100,
    maxHp: 100,
    vx: (Math.random() - 0.5) * 1.5,
    vy: 1.2,
    hit: false,
  });
}

function drawHealthBar(e) {
  if (!e.hit) return;
  const ratio = e.hp / e.maxHp;
  const barWidth = e.w;
  const barHeight = 6;
  const x = e.x;
  const y = e.y - 10;
  const radius = barHeight / 2;

  // Фон (червоний)
  ctx.fillStyle = "red";
  roundRect(ctx, x, y, barWidth, barHeight, radius);
  ctx.fill();

  // Заповнена частина (зелена)
  ctx.fillStyle = "lime";
  roundRect(ctx, x, y, barWidth * ratio, barHeight, radius);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function loop(now) {
  const deltaTime = (now - lastTime) / 16.66;
  lastTime = now;

  // === Очищення
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // === Фон
  bgY += 1 * deltaTime;
  if (bgY >= canvas.height) bgY = 0;
  ctx.drawImage(bgImg, 0, bgY, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, bgY - canvas.height, canvas.width, canvas.height);

  // === Гравець
  player.x += player.speedX * deltaTime;
  player.y += player.speedY * deltaTime;
  player.x = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, player.x));
  player.y = Math.max(player.h / 2, Math.min(canvas.height - player.h / 2, player.y));
  ctx.drawImage(playerImg, player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);

  // === Кулі
  bullets.forEach((b, i) => {
    b.y -= b.vy * deltaTime;
    ctx.fillStyle = "white";
    ctx.fillRect(b.x, b.y, 4, 10);

    // Видалити кулю, якщо за межами
    if (b.y < -10) bullets.splice(i, 1);
  });

  // === Вороги
  enemies.forEach((e, i) => {
    e.x += e.vx * deltaTime;
    e.y += e.vy * deltaTime;

    // Відбивання від країв
    if (e.x <= 0 || e.x + e.w >= canvas.width) e.vx *= -1;

    ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);
    drawHealthBar(e);

    // Перевірка зіткнення з гравцем
    const dx = player.x - (e.x + e.w / 2);
    const dy = player.y - (e.y + e.h / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 35) {
      location.reload(); // Кінець гри
    }

    // Кулі влучають
    bullets.forEach((b, bi) => {
      if (
        b.x > e.x &&
        b.x < e.x + e.w &&
        b.y > e.y &&
        b.y < e.y + e.h
      ) {
        e.hp -= 25;
        e.hit = true;
        bullets.splice(bi, 1);
        if (e.hp <= 0) {
          enemies.splice(i, 1);
          killCount++;
        }
      }
    });
  });

  // === Стрільба кожні 400мс
  spawnTimer += deltaTime;
  if (spawnTimer >= 30) {
    bullets.push({ x: player.x, y: player.y - player.h / 2, vy: 8 });
    spawnTimer = 0;
  }

  // === Спавн ворогів
  if (Math.random() < 0.02 * deltaTime) {
    spawnEnemy();
  }

  // === Рахунок
  ctx.fillStyle = "white";
  ctx.font = "20px sans-serif";
  ctx.fillText(`Kills: ${killCount}`, 20, 30);

  requestAnimationFrame(loop);
}

// === Запуск лише після завантаження зображень
let ready = 0;
[playerImg, bgImg, enemyImg].forEach(img => {
  img.onload = () => {
    ready++;
    if (ready === 3) requestAnimationFrame(loop);
  };
});
