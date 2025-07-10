const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// ==== Гравець ====
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  speedX: 0,
  speedY: 0,
  width: 60,
  height: 60,
  image: new Image()
};
player.image.src = "images/player/player.png";

// ==== Зображення ====
const backgroundFar = new Image();
backgroundFar.src = "images/fon/layer_far.png";

const enemyImg = new Image();
enemyImg.src = "images/enemies/enemy1.png";

// ==== Логіка ====
let bgFarY = 0;
let lastTouch = null;
let stopThreshold = 0.5;
let bullets = [];
let enemies = [];
let lastShotTime = 0;
let lastEnemySpawn = 0;
let killCount = 0;

// ==== Події ====
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
  lastTouch = null;
  player.speedX = 0;
  player.speedY = 0;
});

// ==== Головний цикл ====
let lastFrameTime = performance.now();

function loop(now = performance.now()) {
  const deltaTime = (now - lastFrameTime) / (1000 / 60);
  lastFrameTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground(deltaTime);
  updatePlayer();
  drawPlayer();
  handleShooting(now);
  updateBullets();
  updateEnemies(deltaTime, now);
  drawKillCount();

  requestAnimationFrame(loop);
}

// ==== Малювання ====
function drawPlayer() {
  ctx.drawImage(
    player.image,
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height
  );
}

function drawBackground(deltaTime) {
  bgFarY += 1 * deltaTime;
  if (bgFarY >= canvas.height) bgFarY = 0;
  ctx.drawImage(backgroundFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);
}

function drawKillCount() {
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText(`💥 Знищено: ${killCount}`, 10, 25);
}

// ==== Оновлення ====
function updatePlayer() {
  player.x += player.speedX;
  player.y += player.speedY;

  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
  player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
}

function updateBullets() {
  bullets.forEach((b, i) => {
    b.y -= 6;
    ctx.fillStyle = "white";
    ctx.fillRect(b.x, b.y, 4, 10);
    if (b.y < 0) bullets.splice(i, 1);
  });
}

function handleShooting(now) {
  if (now - lastShotTime > 200) {
    bullets.push({
      x: player.x,
      y: player.y - player.height / 2
    });
    lastShotTime = now;
  }
}

function updateEnemies(deltaTime, now) {
  if (now - lastEnemySpawn > 1000) {
    spawnEnemy();
    lastEnemySpawn = now;
  }

  enemies.forEach((e, i) => {
    e.x += e.vx * deltaTime;
    e.y += e.vy * deltaTime;

    if (e.x <= 0 || e.x + e.w >= canvas.width) e.vx *= -1;

    ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);

    if (e.lastHit && now - e.lastHit < 500) {
      drawHealthBar(e);
    }

    const dx = player.x - (e.x + e.w / 2);
    const dy = player.y - (e.y + e.h / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 35) {
      location.reload();
    }

    bullets.forEach((b, bi) => {
      if (
        b.x > e.x &&
        b.x < e.x + e.w &&
        b.y > e.y &&
        b.y < e.y + e.h
      ) {
        e.hp -= 25;
        e.lastHit = now;
        bullets.splice(bi, 1);
        if (e.hp <= 0) {
          enemies.splice(i, 1);
          killCount++;
        }
      }
    });
  });
}

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
    lastHit: 0,
  });
}

// ==== Шкала здоров’я ====
function drawHealthBar(enemy) {
  const padding = 4;
  const barW = enemy.w - padding * 2;
  const barH = 6;
  const x = enemy.x + padding;
  const y = enemy.y - 10;
  const percent = enemy.hp / enemy.maxHp;

  ctx.fillStyle = "#222";
  roundRect(ctx, x, y, barW, barH, 3);
  ctx.fill();

  ctx.fillStyle = percent > 0.6 ? "#0f0" : percent > 0.3 ? "#ff0" : "#f00";
  roundRect(ctx, x, y, barW * percent, barH, 3);
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

// ==== Старт ====
loop();
