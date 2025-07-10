// === Ініціалізація канвасу ===
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

// === Головний цикл з deltaTime ===
let lastTime = performance.now();

function gameLoop(now) {
  const deltaTime = (now - lastTime) / 1000;
  lastTime = now;

  update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
  player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));

  bgFarY += 100 * dt;
  if (bgFarY > canvas.height) bgFarY = 0;

  bullets.forEach((b, i) => {
    b.y -= 400 * dt;
    if (b.y < -10) bullets.splice(i, 1);
  });

  enemies.forEach((e, i) => {
    e.y += e.speed * dt;
    if (e.y > canvas.height + e.height) enemies.splice(i, 1);

    if (
      e.x < player.x + player.width / 2 &&
      e.x + e.width > player.x - player.width / 2 &&
      e.y < player.y + player.height / 2 &&
      e.y + e.height > player.y - player.height / 2
    ) {
      restartGame();
    }

    bullets.forEach((b, j) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
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
  ctx.drawImage(playerImg, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

  bullets.forEach(b => {
    ctx.fillStyle = "white";
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);
  });

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// === Спавн ===
setInterval(() => {
  bullets.push({
    x: player.x,
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
    speed: 120 + Math.random() * 80
  });
}, 1000);

// === Перезапуск гри ===
function restartGame() {
  score = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
  bullets.length = 0;
  enemies.length = 0;
}

// === Запуск після завантаження ===
Promise.all([
  new Promise(res => playerImg.onload = res),
  new Promise(res => backgroundFar.onload = res),
  new Promise(res => enemyImg.onload = res)
]).then(() => requestAnimationFrame(gameLoop));

