const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  size: 40,
  speed: 6
};

let bullets = [];
let targetPos = null;

// Автоматична стрільба
setInterval(() => {
  bullets.push({ x: player.x, y: player.y - player.size / 2 });
}, 500);

// Зчитування позиції пальця
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  targetPos = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  targetPos = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchend", () => {
  targetPos = null;
});

// Рух гравця — завжди до позиції пальця
function updatePlayer() {
  if (targetPos) {
    const dx = targetPos.x - player.x;
    const dy = targetPos.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 1) {
      const moveX = (dx / distance) * player.speed;
      const moveY = (dy / distance) * player.speed;

      player.x += moveX;
      player.y += moveY;
    }
  }

  // Межі
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
