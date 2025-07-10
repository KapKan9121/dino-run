/* ===== Canvas ===== */
const canvas = document.getElementById("canvas");
const ctx    = canvas.getContext("2d");
canvas.width  = innerWidth;
canvas.height = innerHeight;

/* ===== Зображення ===== */
const playerSprite   = new Image();
const backgroundFar  = new Image();
const enemyImg       = new Image();

playerSprite.src  = "images/player/Gaalian_Liner_128.png";   // спрайт-лист (кадри вертикально)
backgroundFar.src = "images/fon/layer_far.png";
enemyImg.src      = "images/enemy/enemy.png";

/* ===== Параметри анімації гравця ===== */
const FRAME_W       = 128;    // ширина кадру
const FRAME_H       = 128;    // висота кадру
const TOTAL_FRAMES  = 64;     // кількість кадрів у спрайті
const FPS_ANIMATION = 15;     // частота зміни кадру
const FRAME_TIME    = 1000 / FPS_ANIMATION;

/* ===== Об'єкти гри ===== */
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  w: FRAME_W,
  h: FRAME_H,
  frame: 0,           // поточний кадр
  timer: 0            // таймер кадру
};

const bullets  = [];
const enemies  = [];
let   score    = 0;
let   bgY      = 0;

/* ===== Сенсорне керування ===== */
let lastTouch   = null;
const STOP_THR  = 0.5;

canvas.addEventListener("touchstart", e => {
  const t  = e.touches[0];
  lastTouch = { x: t.clientX, y: t.clientY, time: performance.now() };
  player.speedX = player.speedY = 0;
});

canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  if (!lastTouch) return;
  const now = performance.now();

  const dx  = t.clientX - lastTouch.x;
  const dy  = t.clientY - lastTouch.y;
  const dt  = now - lastTouch.time || 16;

  const vx = dx / (dt / 16.66);
  const vy = dy / (dt / 16.66);
  const sp = Math.hypot(vx, vy);

  player.speedX = sp < STOP_THR ? 0 : vx;
  player.speedY = sp < STOP_THR ? 0 : vy;
  lastTouch = { x: t.clientX, y: t.clientY, time: now };
});

canvas.addEventListener("touchend", () => {
  lastTouch = null;
  player.speedX = player.speedY = 0;
});

/* ===== Оновлення ===== */
function update(dt) {
  // Рух гравця
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.w/2, Math.min(canvas.width  - player.w/2, player.x));
  player.y = Math.max(player.h/2, Math.min(canvas.height - player.h/2, player.y));

  // Анімація гравця
  player.timer += dt * 1000;
  if (player.timer >= FRAME_TIME) {
    player.frame = (player.frame + 1) % TOTAL_FRAMES;
    player.timer = 0;
  }

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
  const padX = 10, padY = 6;
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    e.y += e.speed * dt;

    if (e.y > canvas.height + e.h) { enemies.splice(ei, 1); continue; }

    // зіткнення з гравцем
    if (
      e.x + padX < player.x + player.w/2 &&
      e.x + e.w - padX > player.x - player.w/2 &&
      e.y + padY < player.y + player.h/2 &&
      e.y + e.h - padY > player.y - player.h/2
    ) restartGame();

    // кулі → ворог
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (
        b.x < e.x + e.w && b.x + b.w > e.x &&
        b.y < e.y + e.h && b.y + b.h > e.y
      ) {
        enemies.splice(ei, 1);
        bullets.splice(bi, 1);
        score++;
        break;
      }
    }
  }
}

/* ===== Малювання ===== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Фон
  ctx.drawImage(backgroundFar, 0, bgY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgY - canvas.height, canvas.width, canvas.height);

  // Гравець (анімаційний кадр)
  ctx.drawImage(
    playerSprite,
    0, player.frame * FRAME_H, FRAME_W, FRAME_H,          // вихідний кадр
    player.x - player.w/2, player.y - player.h/2, FRAME_W, FRAME_H // позиція на канвасі
  );

  // Кулі
  ctx.fillStyle = "white";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

  // Вороги
  enemies.forEach(e => ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h));

  // Рахунок
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
}

/* ===== Цикл гри ===== */
let lastT = performance.now();
function gameLoop(t = performance.now()) {
  const dt = (t - lastT) / 1000;
  lastT = t;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

/* ===== Спавн куль і ворогів ===== */
setInterval(() => {
  bullets.push({ x: player.x - 2, y: player.y - player.h/2, w:4, h:10 });
}, 250);

setInterval(() => {
  const w = 50;
  enemies.push({
    x: Math.random() * (canvas.width - w),
    y: -60,
    w, h: 50,
    speed: 100 + Math.random() * 80
  });
}, 1000);

/* ===== Перезапуск ===== */
function restartGame() {
  score = 0;
  bullets.length = 0;
  enemies.length = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
}

/* ===== Старт гри після завантаження зображень ===== */
Promise.all([
  new Promise(res => playerSprite.onload  = res),
  new Promise(res => backgroundFar.onload = res),
  new Promise(res => enemyImg.onload      = res)
]).then(() => requestAnimationFrame(gameLoop));
