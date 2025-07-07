const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  size: 40
};

let bullets = [];
let lastTouchPos = null;

// Автоматична стрільба
setInterval(() => {
  bullets.push({ x: player.x, y: player.y - player.size / 2 });
}, 500);

// Обробка торкання
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  lastTouchPos = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchmove", (e) => {
  if (!lastTouchPos) return;

  const t = e.touches[0];
  const dx = t.clientX - lastTouchPos.x;
  const dy = t.clientY - lastTouchPos.y;

  player.x += dx;
  player.y += dy;

  lastTouchPos = { x: t.clientX, y: t.clientY };

  // Межі екрана
  player.x = Math.max(player.size / 2, Math.min(canvas.width - player.size / 2, player.x));
  player.y = Math.max(player.size / 2, Math.min(canvas.height - player.size / 2, player.y));
});

canvas.addEventListener("touchend", () => {
  lastTouchPos = null;
});

// Малювання корабля
function drawPlayer() {
  ctx.fillStyle = "lime";
  ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
}

// Малювання куль
function drawBullets() {
  ctx.fillStyle = "yellow";
  bullets.forEach(b => {
    ctx.fillRect(b.x - 3, b.y - 10, 6, 10);
    b.y -= 10;
  });
  bullets = bullets.filter(b => b.y > 0);
}

// Основний цикл гри
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawBullets();
  requestAnimationFrame(gameLoop);
}

gameLoop();
