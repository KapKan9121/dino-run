const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = {
  x: canvas.width / 2,
  y: canvas.height - 80,
  size: 40,
  speed: 5,
  dx: 0,
  dy: 0
};

let bullets = [];
let enemies = [];
let gameOver = false;

let lastTouch = null;

canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  lastTouch = { x: touch.clientX, y: touch.clientY };
});

canvas.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  const current = { x: touch.clientX, y: touch.clientY };
  const dx = current.x - lastTouch.x;
  const dy = current.y - lastTouch.y;

  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > 2) {
    // нормалізований рух
    const normX = dx / distance;
    const normY = dy / distance;
    player.dx = normX * player.speed;
    player.dy = normY * player.speed;
  } else {
    player.dx = 0;
    player.dy = 0;
  }

  lastTouch = current;
});

canvas.addEventListener("touchend", () => {
  player.dx = 0;
  player.dy = 0;
  lastTouch = null;
});

function drawPlayer() {
  ctx.fillStyle = "lime";
  ctx.fillRect(player.x - player.size / 2, player.y - player.size / 2, player.size, player.size);
}

function drawBullets() {
  ctx.fillStyle = "yellow";
  bullets.forEach(bullet => {
    bullet.y -= 8;
    ctx.fillRect(bullet.x - 3, bullet.y - 10, 6, 10);
  });
  bullets = bullets.filter(b => b.y > 0);
}

function drawEnemies() {
  ctx.fillStyle = "red";
  enemies.forEach(enemy => {
    enemy.y += 2;
    ctx.fillRect(enemy.x - 20, enemy.y - 20, 40, 40);
  });
  enemies = enemies.filter(e => e.y < canvas.height);
}

function spawnEnemy() {
  const x = Math.random() * (canvas.width - 40) + 20;
  enemies.push({ x, y: -40 });
}

function checkBulletEnemyCollision() {
  bullets.forEach((bullet, bIndex) => {
    enemies.forEach((enemy, eIndex) => {
      const dx = bullet.x - enemy.x;
      const dy = bullet.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < 30) {
        bullets.splice(bIndex, 1);
        enemies.splice(eIndex, 1);
      }
    });
  });
}

function checkEnemyPlayerCollision() {
  enemies.forEach(enemy => {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 40) {
      gameOver = true;
    }
  });
}

// 🔫 Автострільба
setInterval(() => {
  if (!gameOver) {
    bullets.push({ x: player.x, y: player.y - player.size / 2 });
  }
}, 500);

// 👾 Спавн ворогів
setInterval(() => {
  if (!gameOver) {
    spawnEnemy();
  }
}, 2000);

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("💀 GAME OVER 💀", canvas.width / 2, canvas.height / 2);
    return;
  }

  // 🟢 Рух гравця тільки під час реального руху пальця
  player.x += player.dx;
  player.y += player.dy;

  // Обмеження по екрану
  player.x = Math.max(player.size / 2, Math.min(canvas.width - player.size / 2, player.x));
  player.y = Math.max(player.size / 2, Math.min(canvas.height - player.size / 2, player.y));

  drawPlayer();
  drawBullets();
  drawEnemies();
  checkBulletEnemyCollision();
  checkEnemyPlayerCollision();

  requestAnimationFrame(gameLoop);
}

gameLoop();
