const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  size: 40,
  targetX: 0,
  targetY: 0,
  speedFactor: 0.3
};

let bullets = [];
let isTouching = false;
let anchor = { x: 0, y: 0 };

// автострільба
setInterval(() => {
  bullets.push({ x: player.x, y: player.y - player.size / 2 });
}, 500);

// зберігаємо початкову точку
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  anchor.x = t.clientX;
  anchor.y = t.clientY;
  isTouching = true;
});

canvas.addEventListener("touchmove", (e) => {
  if (!isTouching) return;
  const t = e.touches[0];
  const dx = t.clientX - anchor.x;
  const dy = t.clientY - anchor.y;

  player.targetX = dx;
  player.targetY = dy;
});

canvas.addEventListener("touchend", () => {
  isTouching = false;
  player.targetX = 0;
  player.targetY = 0;
});

function updatePlayer() {
  if (isTouching) {
    player.x += player.targetX * player.speedFactor;
    player.y += player.targetY * player.speedFactor;
  }

  // межі
  player.x = Math.max(player.size / 2, Math.min(canvas.width - player.size / 2, player.x));
  player.y = Math.max(player.size / 2, Math.min(canvas.height - player.size / 2, player.y));
}

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

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  drawPlayer();
  drawBullets();
  requestAnimationFrame(gameLoop);
}

gameLoop();
