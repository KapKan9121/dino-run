const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  size: 40,
  speedX: 0,
  speedY: 0,
  maxSpeed: 7
};

let touchStart = null;

canvas.addEventListener("touchstart", e => {
  const touch = e.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
});

canvas.addEventListener("touchmove", e => {
  if (!touchStart) return;
  const touch = e.touches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;

  // Чутливість і обмеження швидкості
  const factor = 0.2;
  player.speedX = dx * factor;
  player.speedY = dy * factor;

  // Обмеження максимальної швидкості
  player.speedX = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.speedX));
  player.speedY = Math.max(-player.maxSpeed, Math.min(player.maxSpeed, player.speedY));
});

canvas.addEventListener("touchend", () => {
  player.speedX = 0;
  player.speedY = 0;
  touchStart = null;
});

// Стрільба
let bullets = [];
setInterval(() => {
  bullets.push({ x: player.x, y: player.y - player.size / 2 });
}, 500);

function drawPlayer() {
  ctx.fillStyle = "lime";
  ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
}

function drawBullets() {
  ctx.fillStyle = "yellow";
  bullets.forEach(b => {
    ctx.fillRect(b.x - 3, b.y - 10, 6, 10);
    b.y -= 10;
  });
  bullets = bullets.filter(b => b.y > 0);
}

function updatePlayerPosition() {
  player.x += player.speedX;
  player.y += player.speedY;

  // Межі
  player.x = Math.max(player.size / 2, Math.min(canvas.width - player.size / 2, player.x));
  player.y = Math.max(player.size / 2, Math.min(canvas.height - player.size / 2, player.y));
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayerPosition();
  drawPlayer();
  drawBullets();
  requestAnimationFrame(gameLoop);
}

gameLoop();
