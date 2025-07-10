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
const explosionImg = new Image();
explosionImg.src = "images/effects/explosion_96.png";
const explosionConfig = {
  frameWidth: 96,
  frameHeight: 96,
  frames: 8,
  frameDuration: 0.05,
  scale: 1
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
const explosions = [];

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

// === Функція створення вибуху ===
function createExplosion(x, y) {
  explosions.push({
    x: x - explosionConfig.frameWidth/2,
    y: y - explosionConfig.frameHeight/2,
    currentFrame: 0,
    frameTimer: 0
  });
}

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

    // Колізія з гравцем
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

    // Перевірка попадання куль
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
          createExplosion(e.x + e.width/2, e.y + e.height/2);
          enemies.splice(i, 1);
          score++;
        }
      }
    });
  });

  // Оновлення анімації вибухів
  explosions.forEach((explosion, index) => {
    explosion.frameTimer += dt;
    if (explosion.frameTimer >= explosionConfig.frameDuration) {
      explosion.frameTimer = 0;
      explosion.currentFrame++;
      if (explosion.currentFrame >= explosionConfig.frames) {
        explosions.splice(index, 1);
      }
    }
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

    // Малювання шкали HP
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

  // Малювання вибухів
  explosions.forEach(explosion => {
    ctx.drawImage(
      explosionImg,
      0,
      explosion.currentFrame * explosionConfig.frameHeight,
      explosionConfig.frameWidth,
      explosionConfig.frameHeight,
      explosion.x,
      explosion.y,
      explosionConfig.frameWidth * explosionConfig.scale,
      explosionConfig.frameHeight * explosionConfig.scale
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

// === Дочекаємося повного завантаження ===
Promise.all([
  new Promise(res => playerImg.onload = res),
  new Promise(res => backgroundFar.onload = res),
  new Promise(res => enemyImg.onload = res),
  new Promise(res => explosionImg.onload = res)
]).then(() => requestAnimationFrame(gameLoop));
