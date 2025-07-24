// === Ініціалізація канвасу ===
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// === Завантаження зображень ===
const playerSprite = new Image();
playerSprite.src = "images/player/Gaalian_Liner_128.png";

const backgroundFar = new Image();
backgroundFar.src = "images/fon/layer_far.png";

const enemyImg = new Image();
enemyImg.src = "images/enemy/enemy.png";

// === Параметри анімації ===
const FRAME_W = 128;
const FRAME_H = 128;
const TOTAL_FRAMES = 64;
let frameIndex = 0;
let frameTimer = 0;
const frameInterval = 100; // мс між кадрами

// === Ігрові об'єкти ===
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  w: FRAME_W,
  h: FRAME_H,
  speedX: 0,
  speedY: 0,
  frame: 0
};

const bullets = [];
const enemies = [];

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

// === Головний цикл ===
let lastTime = performance.now();
function gameLoop(now) {
  const deltaTime = now - lastTime;
  lastTime = now;

  update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, player.x));
  player.y = Math.max(player.h / 2, Math.min(canvas.height - player.h / 2, player.y));

  // Анімація гравця
  frameTimer += dt;
  if (frameTimer >= frameInterval) {
    frameTimer = 0;
    frameIndex = (frameIndex + 1) % TOTAL_FRAMES;
    player.frame = frameIndex;
  }

  bgFarY += 100 * dt / 1000;
  if (bgFarY > canvas.height) bgFarY = 0;

  bullets.forEach((b, i) => {
    b.y -= 400 * dt / 1000;
    if (b.y < -10) bullets.splice(i, 1);
  });

  enemies.forEach((e, i) => {
    e.y += e.speed * dt / 1000;
    if (e.y > canvas.height + e.h) enemies.splice(i, 1);

    if (
      e.x < player.x + player.w / 2 &&
      e.x + e.w > player.x - player.w / 2 &&
      e.y < player.y + player.h / 2 &&
      e.y + e.h > player.y - player.h / 2
    ) {
      restartGame();
    }

    bullets.forEach((b, j) => {
      if (
        b.x < e.x + e.w &&
        b.x + b.w > e.x &&
        b.y < e.y + e.h &&
        b.y + b.h > e.y
      ) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score++;
      }
    });
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);

  if (playerSprite.complete && playerSprite.naturalHeight !== 0) {
    ctx.drawImage(
      playerSprite,
      0, player.frame * FRAME_H, FRAME_W, FRAME_H,
      player.x - player.w / 2, player.y - player.h / 2, FRAME_W, FRAME_H
    );
  } else {
    ctx.fillStyle = "lime";
    ctx.fillRect(player.x - 20, player.y - 20, 40, 40);
  }

  bullets.forEach(b => {
    ctx.fillStyle = "white";
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });

  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);
  });

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

setInterval(() => {
  bullets.push({
    x: player.x,
    y: player.y - player.h / 2,
    w: 4,
    h: 10
  });
}, 250);

setInterval(() => {
  const eW = 50;
  enemies.push({
    x: Math.random() * (canvas.width - eW),
    y: -60,
    w: eW,
    h: 50,
    speed: 120 + Math.random() * 80
  });
}, 1000);

function restartGame() {
  score = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
  bullets.length = 0;
  enemies.length = 0;
}

Promise.all([
  new Promise(res => playerSprite.onload = res),
  new Promise(res => backgroundFar.onload = res),
  new Promise(res => enemyImg.onload = res)
]).then(() => requestAnimationFrame(gameLoop));
