// === Налаштування канвасу ===
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// === Гравець ===
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

// === Фон ===
const backgroundFar = new Image();
backgroundFar.src = "images/fon/layer_far.png";
let bgFarY = 0;

// === Вороги ===
let enemies = [];
const enemyImage = new Image();
enemyImage.src = "images/enemy/enemy.png";

function spawnEnemy() {
  const enemy = {
    x: Math.random() * (canvas.width - 60) + 30,
    y: -60,
    width: 60,
    height: 60,
    speedY: 2 + Math.random() * 2,
    image: enemyImage
  };
  enemies.push(enemy);
}

// === Кулі ===
const bullets = [];

// === Рахунок ===
let score = 0;

// === Завантаження ===
let assetsLoaded = 0;
const totalAssets = 3;

[player.image, backgroundFar, enemyImage].forEach(img => {
  img.onload = () => {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) loop();
  };
});

// === Малювання ===
function drawPlayer() {
  ctx.drawImage(
    player.image,
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height
  );
}

function drawEnemies() {
  enemies.forEach(e => {
    ctx.drawImage(
      e.image,
      e.x - e.width / 2,
      e.y - e.height / 2,
      e.width,
      e.height
    );
  });
}

function drawBullets() {
  ctx.fillStyle = "white";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Знищено: " + score, 10, 30);
}

// === Оновлення ===
function updatePlayer() {
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
  player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
}

function updateEnemies() {
  enemies.forEach((e, i) => {
    e.y += e.speedY;
    if (e.y > canvas.height + e.height) enemies.splice(i, 1);
  });
}

function updateBullets() {
  bullets.forEach((b, i) => {
    b.y -= 5;
    if (b.y < 0) bullets.splice(i, 1);
  });
}

function checkCollisions() {
  bullets.forEach((b, i) => {
    enemies.forEach((e, j) => {
      if (
        b.x > e.x - e.width / 2 && b.x < e.x + e.width / 2 &&
        b.y > e.y - e.height / 2 && b.y < e.y + e.height / 2
      ) {
        bullets.splice(i, 1);
        enemies.splice(j, 1);
        score++;
      }
    });
  });

  enemies.forEach(e => {
    if (
      player.x < e.x + e.width / 2 &&
      player.x + player.width / 2 > e.x - e.width / 2 &&
      player.y < e.y + e.height / 2 &&
      player.y + player.height / 2 > e.y - e.height / 2
    ) {
      restartGame();
    }
  });
}

function drawBackground() {
  bgFarY += 1.0;
  if (bgFarY >= canvas.height) bgFarY = 0;
  ctx.drawImage(backgroundFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);
}

// === Керування ===
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

// === Стрільба ===
setInterval(() => {
  bullets.push({
    x: player.x,
    y: player.y - player.height / 2
  });
}, 300);

// === Поява ворогів залежно від рахунку ===
setInterval(() => {
  const enemyCount = Math.min(5 + Math.floor(score / 3), 20);
  if (enemies.length < enemyCount) spawnEnemy();
}, 1000);

// === Перезапуск гри ===
function restartGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
  enemies = [];
  bullets.length = 0;
  score = 0;
}

// === Цикл ===
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  updatePlayer();
  updateEnemies();
  updateBullets();
  drawPlayer();
  drawEnemies();
  drawBullets();
  drawScore();
  checkCollisions();
  requestAnimationFrame(loop);
}
