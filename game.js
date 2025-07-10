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

// === Об'єкти ===
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

  // Рух фону
  bgFarY += 100 * dt;
  if (bgFarY > canvas.height) bgFarY = 0;

  // Рух куль
  bullets.forEach((b, i) => {
    b.y -= 400 * dt;
    if (b.y < -10) bullets.splice(i, 1);
  });

  // Рух ворогів
  enemies.forEach((e, i) => {
    e.y += e.speed * dt;
    if (e.y > canvas.height + e.h) enemies.splice(i, 1);

    // Столкнення з гравцем
    if (
      e.x < player.x + player.width / 2 &&
      e.x + e.w > player.x - player.width / 2 &&
      e.y < player.y + player.height / 2 &&
      e.y + e.h > player.y - player.height / 2
    ) {
      restartGame();
    }

    // Куля влучає у ворога
    bullets.forEach((b, j) => {
      if (
        b.x < e.x + e.w &&
        b.x + b.width > e.x &&
        b.y < e.y + e.h &&
        b.y + b.height > e.y
      ) {
        bullets.splice(j, 1);
        e.hp--;
        e.showHP = true;

        if (e.hp <= 0) {
          enemies.splice(i, 1);
          score++;
        }
      }
    });
  });
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);

  // Гравець
  ctx.drawImage(playerImg, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

  // Кулі
  bullets.forEach(b => {
    ctx.fillStyle = "white";
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  // Вороги
  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);
    drawHP(e);
  });

  // Очки
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// === Шкала здоров’я ===
function drawHP(e) {
  if (!e.showHP || e.hp >= e.maxHp) return;

  const segments = e.maxHp;
  const filled = segments - e.hp;

  const segmentGap = 2;
  const barWidth = e.w;
  const barHeight = 6;
  const barX = e.x;
  const barY = e.y - 10;
  const segmentWidth = (barWidth - (segments - 1) * segmentGap) / segments;

  for (let i = 0; i < segments; i++) {
    const x = barX + i * (segmentWidth + segmentGap);

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.roundRect(x, barY, segmentWidth, barHeight, 2);
    ctx.fill();

    if (i < filled) {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.roundRect(x, barY, segmentWidth, barHeight, 2);
      ctx.fill();
    }
  }
}

// === Спавн куль і ворогів ===
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
    w: eWidth,
    h: 50,
    speed: 100 + Math.random() * 80,
    hp: 3,
    maxHp: 3,
    showHP: false
  });
}, 1000);

// === Перезапуск гри ===
function restartGame() {
  score = 0;
  bullets.length = 0;
  enemies.length = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
}

// === Запуск після завантаження зображень ===
Promise.all([
  new Promise(res => playerImg.onload = res),
  new Promise(res => backgroundFar.onload = res),
  new Promise(res => enemyImg.onload = res)
]).then(() => requestAnimationFrame(gameLoop));
