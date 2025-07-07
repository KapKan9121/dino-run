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

// === Ворог ===
const enemy = {
  x: canvas.width / 2,
  y: 0,
  width: 60,
  height: 60,
  speedY: 2,
  image: new Image()
};
enemy.image.src = "images/enemy/enemy.png";

// === Кулі ===
const bullets = [];

// === Фон ===
const backgroundFar = new Image();
backgroundFar.src = "images/fon/layer_far.png";
let bgFarY = 0;

// === Рахунок ===
let score = 0;

// === Малювання гравця ===
function drawPlayer() {
  ctx.drawImage(
    player.image,
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height
  );
}

// === Малювання ворога ===
function drawEnemy() {
  ctx.drawImage(
    enemy.image,
    enemy.x - enemy.width / 2,
    enemy.y - enemy.height / 2,
    enemy.width,
    enemy.height
  );
}

// === Малювання куль ===
function drawBullets() {
  ctx.fillStyle = "white";
  bullets.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// === Малювання рахунку ===
function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Знищено: " + score, 10, 30);
}

// === Оновлення гравця ===
function updatePlayer() {
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
  player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
}

// === Оновлення ворога ===
function updateEnemy() {
  enemy.y += enemy.speedY;
  if (enemy.y > canvas.height + enemy.height) {
    resetEnemy();
  }
}

// === Оновлення куль ===
function updateBullets() {
  bullets.forEach((b, i) => {
    b.y -= 5;
    if (b.y < 0) bullets.splice(i, 1);
  });
}

// === Перевірка зіткнень ===
function checkCollision() {
  bullets.forEach((b, i) => {
    if (
      b.x > enemy.x - enemy.width / 2 &&
      b.x < enemy.x + enemy.width / 2 &&
      b.y > enemy.y - enemy.height / 2 &&
      b.y < enemy.y + enemy.height / 2
    ) {
      bullets.splice(i, 1);
      score++;
      resetEnemy();
    }
  });

  if (
    player.x < enemy.x + enemy.width / 2 &&
    player.x + player.width / 2 > enemy.x - enemy.width / 2 &&
    player.y < enemy.y + enemy.height / 2 &&
    player.y + player.height / 2 > enemy.y - enemy.height / 2
  ) {
    restartGame();
  }
}

// === Малювання фону ===
function drawBackground() {
  bgFarY += 1.0;
  if (bgFarY >= canvas.height) bgFarY = 0;
  ctx.drawImage(backgroundFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);
}

// === Керування через сенсор ===
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

// === Автоматична стрільба ===
setInterval(() => {
  bullets.push({
    x: player.x,
    y: player.y - player.height / 2
  });
}, 300);

// === Скидання ворога ===
function resetEnemy() {
  enemy.x = Math.random() * (canvas.width - enemy.width) + enemy.width / 2;
  enemy.y = 0;
}

// === Перезапуск гри ===
function restartGame() {
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
  resetEnemy();
  bullets.length = 0;
  score = 0;
}

// === Основний цикл ===
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  updatePlayer();
  updateEnemy();
  updateBullets();
  drawPlayer();
  drawEnemy();
  drawBullets();
  drawScore();
  checkCollision();
  requestAnimationFrame(loop);
}

loop();
