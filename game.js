/* === game.js — версія зі сегментованою шкалою HP ================================= */

const canvas = document.getElementById("canvas");
const ctx    = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

/* ── Polyfill для roundRect (якщо не підтримується) ── */
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

/* ── Зображення ── */
const playerImg     = new Image();
const backgroundFar = new Image();
const enemyImg      = new Image();

playerImg.src     = "images/player/player.png";
backgroundFar.src = "images/fon/layer_far.png";
enemyImg.src      = "images/enemy/enemy.png";

/* ── Гравець ── */
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  width: 60,
  height: 60,
  speedX: 0,
  speedY: 0
};

/* ── Масиви ── */
const bullets = [];
const enemies = [];

/* ── Глобальні змінні ── */
let score = 0;
let bgFarY = 0;
let lastTime = performance.now();

/* ── Сенсорне керування ── */
let lastTouch = null;
const STOP = 0.5;

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  lastTouch = { x: t.clientX, y: t.clientY, time: performance.now() };
  player.speedX = player.speedY = 0;
});

canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  if (!lastTouch) return;
  const now = performance.now();
  const dx = t.clientX - lastTouch.x;
  const dy = t.clientY - lastTouch.y;
  const dt = now - lastTouch.time || 16;

  const vx = dx / (dt / 16.66);
  const vy = dy / (dt / 16.66);
  const sp = Math.hypot(vx, vy);

  player.speedX = sp < STOP ? 0 : vx;
  player.speedY = sp < STOP ? 0 : vy;
  lastTouch = { x: t.clientX, y: t.clientY, time: now };
});

canvas.addEventListener("touchend", () => {
  lastTouch = null;
  player.speedX = player.speedY = 0;
});

/* ── Оновлення ── */
function update(dt) {
  // Гравець
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
  player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));

  // Фон
  bgFarY += 100 * dt;
  if (bgFarY > canvas.height) bgFarY = 0;

  // Кулі
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= 400 * dt;
    if (b.y < -b.height) bullets.splice(i, 1);
  }

  // Вороги
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    e.y += e.speed * dt;

    // видаляємо якщо за екраном
    if (e.y > canvas.height + e.height) { enemies.splice(ei, 1); continue; }

    // зіткнення з гравцем
    if (
      e.x < player.x + player.width / 2 &&
      e.x + e.width > player.x - player.width / 2 &&
      e.y < player.y + player.height / 2 &&
      e.y + e.height > player.y - player.height / 2
    ) restartGame();

    // кулі бʼють ворога
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (
        b.x < e.x + e.width && b.x + b.width > e.x &&
        b.y < e.y + e.height && b.y + b.height > e.y
      ) {
        bullets.splice(bi, 1);
        e.hp--;
        e.showHP = true;
        if (e.hp <= 0) { enemies.splice(ei, 1); score++; }
        break;
      }
    }
  }
}

/* ── Малювання ── */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // фон
  ctx.drawImage(backgroundFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);

  // гравець
  ctx.drawImage(playerImg, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

  // кулі
  ctx.fillStyle = "white";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));

  // вороги + шкали
  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
    drawHP(e);
  });

  // рахунок
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
}

/* ── Сегментована шкала HP ── */
function drawHP(e) {
  if (!e.showHP || e.hp >= e.maxHp) return;

  const segments      = e.maxHp;
  const activeSegs    = e.hp;               // залишилось
  const gap           = 2;
  const barHeight     = 4;                  // тонша
  const barWidth      = e.width;
  const segW          = (barWidth - (segments - 1) * gap) / segments;
  const y             = e.y - 8;
  const xStart        = e.x;

  for (let i = 0; i < segments; i++) {
    const x = xStart + i * (segW + gap);

    // фон сегмента — світло-сірий
    ctx.fillStyle = "rgba(150,150,150,0.5)";
    ctx.beginPath();
    ctx.roundRect(x, y, segW, barHeight, 2);
    ctx.fill();

    // активний сегмент (червоний) — залишок HP
    if (i < activeSegs) {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.roundRect(x, y, segW, barHeight, 2);
      ctx.fill();
    }
  }
}

/* ── Цикл гри ── */
function gameLoop(now = performance.now()) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

/* ── Авто-стрільба ── */
setInterval(() => {
  bullets.push({
    x: player.x - 2,
    y: player.y - player.height / 2,
    width: 4,
    height: 10
  });
}, 250);

/* ── Спавн ворогів ── */
setInterval(() => {
  const w = 50;
  enemies.push({
    x: Math.random() * (canvas.width - w),
    y: -60,
    width: w,
    height: 50,
    speed: 100 + Math.random() * 80,
    hp: 3,          // потрібно 3 постріли
    maxHp: 3,
    showHP: false
  });
}, 1000);

/* ── Перезапуск ── */
function restartGame() {
  score = 0;
  bullets.length = 0;
  enemies.length = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
}

/* ── Старт після завантаження всіх зображень ── */
Promise.all([
  new Promise(res => playerImg.onload      = res),
  new Promise(res => backgroundFar.onload  = res),
  new Promise(res => enemyImg.onload       = res)
]).then(() => requestAnimationFrame(gameLoop));
