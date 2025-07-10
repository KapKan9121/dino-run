
// === Ініціалізація ===
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// === Гравець ===
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  width: 60,
  height: 60,
  speedX: 0,
  speedY: 0,
  image: new Image()
};
player.image.src = "images/player/player.png";

// === Фон ===
const backgroundFar = new Image();
backgroundFar.src = "images/fon/layer_far.png";
let bgFarY = 0;

// === Кулі ===
const bullets = [];
const BULLET_SPEED = 8;

// === Вороги ===
const enemies = [];
const ENEMY_SPAWN_INTERVAL = 1500;
let lastEnemySpawn = 0;

// === Лічильник ===
let score = 0;

// === Завантаження гри ===
let assetsLoaded = 0;
player.image.onload = () => assetsLoaded++;
backgroundFar.onload = () => assetsLoaded++;

// === Керування ===
let lastTouch = null;
let stopThreshold = 0.5;

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  lastTouch = { x: t.clientX, y: t.clientY, time: performance.now() };
  player.speedX = 0;
  player.speedY = 0;
});
canvas.addEventListener("touchmove", e => {
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

// === Логіка ===
function drawPlayer() {
  ctx.drawImage(player.image, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
}
function updatePlayer(deltaTime) {
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
  player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
}
function drawBackground(deltaTime) {
  bgFarY += 100 * deltaTime;
  if (bgFarY > canvas.height) bgFarY = 0;
  ctx.drawImage(backgroundFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);
}
function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - 50),
    y: -60,
    width: 50,
    height: 50,
    speed: 100 + Math.random() * 50,
    hp: 3,
    maxHp: 3
  });
}
function drawEnemies(deltaTime) {
  enemies.forEach((e, index) => {
    e.y += e.speed * deltaTime;
    // Малюємо ворога
    ctx.fillStyle = "gray";
    ctx.fillRect(e.x, e.y, e.width, e.height);
    // Малюємо шкалу здоров'я
    const hpRatio = e.hp / e.maxHp;
    ctx.fillStyle = "red";
    ctx.fillRect(e.x, e.y - 10, e.width, 5);
    ctx.fillStyle = "lime";
    ctx.fillRect(e.x, e.y - 10, e.width * hpRatio, 5);
    // Якщо ворог виходить за межі — видаляємо
    if (e.y > canvas.height + 50) enemies.splice(index, 1);
  });
}
function drawBullets(deltaTime) {
  bullets.forEach((b, i) => {
    b.y -= BULLET_SPEED;
    ctx.fillStyle = "white";
    ctx.fillRect(b.x, b.y, 5, 10);
    if (b.y < 0) bullets.splice(i, 1);
  });
}
function handleCollisions() {
  bullets.forEach((b, bi) => {
    enemies.forEach((e, ei) => {
      if (
        b.x < e.x + e.width &&
        b.x + 5 > e.x &&
        b.y < e.y + e.height &&
        b.y + 10 > e.y
      ) {
        e.hp--;
        bullets.splice(bi, 1);
        if (e.hp <= 0) {
          enemies.splice(ei, 1);
          score++;
        }
      }
    });
  });
}
function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// === Анімаційний цикл ===
let lastTime = performance.now();
function gameLoop(now) {
  const deltaTime = (now - lastTime) / 1000;
  lastTime = now;

  if (assetsLoaded < 2) {
    requestAnimationFrame(gameLoop);
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(deltaTime);
  updatePlayer(deltaTime);
  drawPlayer();
  drawBullets(deltaTime);
  drawEnemies(deltaTime);
  handleCollisions();
  drawScore();

  // Стріляємо автоматично кожні 300 мс
  if (now % 300 < 16) {
    bullets.push({ x: player.x, y: player.y - 30 });
  }

  // Спавн ворогів
  if (now - lastEnemySpawn > ENEMY_SPAWN_INTERVAL) {
    spawnEnemy();
    lastEnemySpawn = now;
  }

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
