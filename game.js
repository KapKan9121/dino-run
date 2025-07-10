const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// === Завантаження зображень ===
const playerImg = new Image();
playerImg.src = "images/player/player.png";

const backgroundFar = new Image();
backgroundFar.src = "images/fon/layer_far.png";

const enemyImg = new Image();
enemyImg.src = "images/enemy/enemy.png";

// --- Спрайт вибуху ---
const explosionImg = new Image();
explosionImg.src = "images/effects/explosion_96.png";
const explosionConfig = {
  frameWidth: 96,
  frameHeight: 96,
  frameCount: 8,
  animationSpeed: 0.05,
  scale: 1.5
};

// === Ігрові об'єкти ===
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  width: 60,
  height: 60,
  speedX: 0,
  speedY: 0
};

const bullets = [];
const enemies = [];
const explosions = [];

let score = 0;
let bgFarY = 0;

// === Сенсорне керування ===
let lastTouch = null;
const stopThreshold = 0.5;

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

// === Функція створення вибуху ===
function createExplosion(x, y) {
  explosions.push({
    x: x - (explosionConfig.frameWidth * explosionConfig.scale)/2,
    y: y - (explosionConfig.frameHeight * explosionConfig.scale)/2,
    currentFrame: 0,
    frameTimer: 0,
    width: explosionConfig.frameWidth * explosionConfig.scale,
    height: explosionConfig.frameHeight * explosionConfig.scale
  });
}

// === Головний цикл ===
let lastTime = performance.now();
function gameLoop(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Рух гравця
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.width/2, Math.min(canvas.width - player.width/2, player.x));
  player.y = Math.max(player.height/2, Math.min(canvas.height - player.height/2, player.y));

  // Рух фону
  bgFarY += 100 * dt;
  if (bgFarY > canvas.height) bgFarY = 0;

  // Рух куль
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= 400 * dt;
    if (bullets[i].y < -10) bullets.splice(i, 1);
  }

  // Рух ворогів
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.y += enemy.speed * dt;

    // Видалення ворогів за екраном
    if (enemy.y > canvas.height + enemy.height) {
      enemies.splice(i, 1);
      continue;
    }

    // Колізія з гравцем
    const padX = 10, padY = 6;
    if (
      enemy.x + padX < player.x + player.width/2 &&
      enemy.x + enemy.width - padX > player.x - player.width/2 &&
      enemy.y + padY < player.y + player.height/2 &&
      enemy.y + enemy.height - padY > player.y - player.height/2
    ) {
      restartGame();
      return;
    }

    // Колізія з кулями
    for (let j = bullets.length - 1; j >= 0; j--) {
      const bullet = bullets[j];
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        enemy.hp--;
        bullets.splice(j, 1);
        
        if (enemy.hp <= 0) {
          createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
          enemies.splice(i, 1);
          score += 10;
          break;
        }
      }
    }
  }

  // Оновлення анімації вибухів
  for (let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i];
    explosion.frameTimer += dt;
    
    if (explosion.frameTimer >= explosionConfig.animationSpeed) {
      explosion.frameTimer = 0;
      explosion.currentFrame++;
      
      if (explosion.currentFrame >= explosionConfig.frameCount) {
        explosions.splice(i, 1);
      }
    }
  }
}

function draw() {
  // Очищення екрану
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Малювання фону
  ctx.drawImage(backgroundFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);

  // Малювання гравця
  ctx.drawImage(
    playerImg, 
    player.x - player.width/2, 
    player.y - player.height/2, 
    player.width, 
    player.height
  );

  // Малювання куль
  ctx.fillStyle = "white";
  bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  // Малювання ворогів
  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x, e.y, e.width, e.height);

    // Шкала HP
    if (e.hp < e.maxHp) {
      const segmentCount = e.maxHp;
      const spacing = 2;
      const barHeight = 3;
      const segmentWidth = (e.width - (segmentCount - 1) * spacing) / segmentCount;
      
      for (let i = 0; i < segmentCount; i++) {
        ctx.fillStyle = i < e.hp ? "red" : "rgba(80,80,80,0.5)";
        ctx.fillRect(
          e.x + i * (segmentWidth + spacing),
          e.y - 8,
          segmentWidth,
          barHeight
        );
      }
    }
  });

  // Малювання вибухів
  explosions.forEach(explosion => {
    ctx.drawImage(
      explosionImg,
      0,
      explosion.currentFrame * explosionConfig.frameHeight,
      explosionConfig.frameWidth,
      explosionConfig.frameHeight,
      explosion.x,
      explosion.y,
      explosion.width,
      explosion.height
    );
  });

  // Малювання рахунку
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(`Score: ${score}`, 20, 40);
}

// === Спавн куль ===
setInterval(() => {
  bullets.push({
    x: player.x - 2,
    y: player.y - player.height/2,
    width: 4,
    height: 10
  });
}, 250);

// === Спавн ворогів ===
setInterval(() => {
  const width = 50;
  enemies.push({
    x: Math.random() * (canvas.width - width),
    y: -60,
    width: width,
    height: 50,
    speed: 120 + Math.random() * 80,
    hp: 3,
    maxHp: 3
  });
}, 1000);

// === Перезапуск гри ===
function restartGame() {
  score = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
  bullets.length = 0;
  enemies.length = 0;
  explosions.length = 0;
}

// === Запуск гри після завантаження ресурсів ===
Promise.all([
  new Promise(resolve => { playerImg.onload = resolve; }),
  new Promise(resolve => { backgroundFar.onload = resolve; }),
  new Promise(resolve => { enemyImg.onload = resolve; }),
  new Promise(resolve => { explosionImg.onload = resolve; })
]).then(() => {
  requestAnimationFrame(gameLoop);
});
