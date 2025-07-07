const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  size: 40,
  velocityX: 0,
  velocityY: 0
};

let bullets = [];
let lastTouch = null;

// Автострільба
setInterval(() => {
  bullets.push({ x: player.x, y: player.y - player.size / 2 });
}, 500);

// Рух — вектор зберігається
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  lastTouch = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  if (!lastTouch) {
    lastTouch = { x: t.clientX, y: t.clientY };
    return;
  }

  const dx = t.clientX - lastTouch.x;
  const dy = t.clientY - lastTouch.y;

  // Зберігаємо швидкість — масштаб можна коригувати
  player.velocityX = dx * 0.5;
  player.velocityY = dy * 0.5;

  lastTouch = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchend", () => {
  lastTouch = null;
  player.velocityX = 0;
  player.velocityY = 0;
});

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

function updatePlayer() {
  player.x += player.velocityX;
  player.y += player.velocityY;

  // Межі
  player.x = Math.max(player.size / 2, Math.min(canvas.width - player.size / 2, player.x));
  player.y = Math.max(player.size / 2, Math.min(canvas.height - player.size / 2, player.y));
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  drawPlayer();
  drawBullets();
  requestAnimationFrame(gameLoop);
}

gameLoop();
