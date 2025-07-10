<canvas id="canvas"></canvas>
<script>
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// Гравець
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  width: 60,
  height: 60,
  speedX: 0,
  speedY: 0
};

// Кулі та вороги
const bullets = [];
const enemies = [];
let score = 0;
let lastTime = performance.now();

// Сенсор
let lastTouch = null;
let stopThreshold = 0.5;

// Керування
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

// Оновлення
function update(dt) {
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
  player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));

  bullets.forEach((b, i) => {
    b.y -= 400 * dt;
    if (b.y < -10) bullets.splice(i, 1);
  });

  enemies.forEach((e, i) => {
    e.y += e.speed * dt;

    if (e.y > canvas.height + e.height) enemies.splice(i, 1);

    // зіткнення з гравцем
    if (
      e.x < player.x + player.width / 2 &&
      e.x + e.width > player.x - player.width / 2 &&
      e.y < player.y + player.height / 2 &&
      e.y + e.height > player.y - player.height / 2
    ) {
      restartGame();
    }

    // зіткнення з кулями
    bullets.forEach((b, j) => {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        bullets.splice(j, 1);
        e.hp -= 1;
        if (e.hp <= 0) {
          enemies.splice(i, 1);
          score++;
        }
      }
    });
  });
}

// Малювання
function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Гравець
  ctx.fillStyle = "lime";
  ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);

  // Кулі
  bullets.forEach(b => {
    ctx.fillStyle = "white";
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  // Вороги
  enemies.forEach(e => {
    ctx.fillStyle = "red";
    ctx.fillRect(e.x, e.y, e.width, e.height);

    // Шкала HP
    if (e.hp < e.maxHp) {
      const barWidth = e.width * 0.8;
      const barX = e.x + (e.width - barWidth) / 2;
      const barY = e.y - 6;
      ctx.fillStyle = "#444";
      ctx.fillRect(barX, barY, barWidth, 4);
      ctx.fillStyle = "white";
      ctx.fillRect(barX, barY, (barWidth * e.hp) / e.maxHp, 4);
    }
  });

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// Цикл
function gameLoop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

// Стрілянина
setInterval(() => {
  bullets.push({
    x: player.x,
    y: player.y - player.height / 2,
    width: 4,
    height: 10
  });
}, 250);

// Спавн ворогів
setInterval(() => {
  const eWidth = 50;
  enemies.push({
    x: Math.random() * (canvas.width - eWidth),
    y: -60,
    width: eWidth,
    height: 50,
    speed: 60 + Math.random() * 60,
    maxHp: 3,
    hp: 3
  });
}, 1000);

// Перезапуск
function restartGame() {
  score = 0;
  bullets.length = 0;
  enemies.length = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
}

requestAnimationFrame(gameLoop);
</script>
