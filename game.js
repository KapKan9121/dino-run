/* ===== game.js – оновлений, оптимізований  ================================= */

// ── Canvas ─────────────────────────────────────────────────────────────────────
const canvas = document.getElementById("canvas");
const ctx    = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// ── Polyfill для roundRect (якщо браузер не підтримує) ─────────────────────────
if (!ctx.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r);
    this.lineTo(x + w, y + h - r);
    this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.lineTo(x + r, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r);
    this.lineTo(x, y + r);
    this.quadraticCurveTo(x, y, x + r, y);
    this.closePath();
  };
}

// ── Зображення ────────────────────────────────────────────────────────────────
const playerImg     = new Image();
const backgroundFar = new Image();
const enemyImg      = new Image();

playerImg.src     = "images/player/player.png";
backgroundFar.src = "images/fon/layer_far.png";
enemyImg.src      = "images/enemy/enemy.png";

// ── Гравець ───────────────────────────────────────────────────────────────────
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  w: 60, h: 60,
  vx: 0, vy: 0
};

// ── Масиви ────────────────────────────────────────────────────────────────────
const bullets = [];
const enemies = [];

// ── Ігрові змінні ─────────────────────────────────────────────────────────────
let score  = 0;
let bgY    = 0;
let lastT  = performance.now();

// ── Сенсорне керування ────────────────────────────────────────────────────────
let lastTouch = null;
const STOP = 0.5;

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  lastTouch = { x: t.clientX, y: t.clientY, t: performance.now() };
  player.vx = player.vy = 0;
});

canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  if (!lastTouch) return;
  const now = performance.now();
  const dx  = t.clientX - lastTouch.x;
  const dy  = t.clientY - lastTouch.y;
  const dt  = now - lastTouch.t || 16;

  const vx = dx / (dt / 16.66);
  const vy = dy / (dt / 16.66);
  const sp = Math.hypot(vx, vy);

  player.vx = sp < STOP ? 0 : vx;
  player.vy = sp < STOP ? 0 : vy;
  lastTouch = { x: t.clientX, y: t.clientY, t: now };
});

canvas.addEventListener("touchend",
  () => { lastTouch = null; player.vx = player.vy = 0; });

// ── Логіка оновлення ─────────────────────────────────────────────────────────
function update(dt) {
  // Рух гравця
  player.x += player.vx;
  player.y += player.vy;
  player.x = Math.max(player.w/2, Math.min(canvas.width  - player.w/2, player.x));
  player.y = Math.max(player.h/2, Math.min(canvas.height - player.h/2, player.y));

  // Фон
  bgY += 100 * dt;
  if (bgY > canvas.height) bgY -= canvas.height;

  // Кулі
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= 400 * dt;
    if (b.y < -b.h) bullets.splice(i, 1);
  }

  // Вороги
  const PAD = 8;                           // padding для хітбокса
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    e.y += e.speed * dt;

    // Видалення якщо нижче екрана
    if (e.y > canvas.height + e.h) { enemies.splice(ei, 1); continue; }

    // Зіткнення з гравцем (менший хітбокс)
    if (
      e.x + PAD < player.x + player.w/2  &&
      e.x + e.w - PAD > player.x - player.w/2 &&
      e.y + PAD < player.y + player.h/2  &&
      e.y + e.h - PAD > player.y - player.h/2
    ) restartGame();

    // Перевірка влучань
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (
        b.x < e.x + e.w && b.x + b.w > e.x &&
        b.y < e.y + e.h && b.y + b.h > e.y
      ) {
        bullets.splice(bi, 1);
        e.hp -= 50;
        e.showHP = true;
        if (e.hp <= 0) { enemies.splice(ei, 1); score++; }
        break;
      }
    }
  }
}

// ── Малювання ────────────────────────────────────────────────────────────────
function draw() {
  // Фон
  ctx.drawImage(backgroundFar, 0, bgY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgY - canvas.height, canvas.width, canvas.height);

  // Гравець
  ctx.drawImage(playerImg, player.x - player.w/2, player.y - player.h/2, player.w, player.h);

  // Кулі
  ctx.fillStyle = "white";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  // Вороги + HP
  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);
    drawHP(e);
  });

  // Рахунок
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
}

// ── Шкала HP ────────────────────────────────────────────────────────────────
function drawHP(e) {
  if (!e.showHP || e.hp >= e.maxHp) return;
  const x = e.x, y = e.y - 10;
  const w = e.w, h = 6;
  const ratio = e.hp / e.maxHp;

  ctx.fillStyle = "#350000";
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "red";
  ctx.roundRect(x, y, w * ratio, h, 3);
  ctx.fill();
}

// ── Цикл гри ────────────────────────────────────────────────────────────────
function gameLoop(t = performance.now()) {
  const dt = (t - lastT) / 1000;
  lastT = t;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

// ── Масове створення ────────────────────────────────────────────────────────
setInterval(() => bullets.push({ x: player.x - 2, y: player.y - player.h/2, w:4, h:10 }), 250);

setInterval(() => {
  const w = 50;
  enemies.push({
    x: Math.random() * (canvas.width - w),
    y: -60, w, h: 50,
    speed: 120 + Math.random() * 80,
    hp: 100, maxHp: 100,
    showHP: false
  });
}, 1000);

// ── Перезапуск ──────────────────────────────────────────────────────────────
function restartGame() {
  score = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
  bullets.length = 0;
  enemies.length = 0;
}

// ── Старт після завантаження зображень ──────────────────────────────────────
Promise.all([
  new Promise(res => playerImg.onload      = res),
  new Promise(res => backgroundFar.onload  = res),
  new Promise(res => enemyImg.onload       = res)
]).then(() => requestAnimationFrame(gameLoop));
