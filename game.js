// === Canvas ініціалізація ===
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

// --- СПРАЙТ вибуху ---
const explosionSheet = {
  img: new Image(),
  frameW: 96,              // ширина кадру (ваш спрайт explosion_96.png)
  frameH: 96,              // висота кадру
  scale: 1,                // масштабування (1 = оригінальний розмір)
  frames: 8                // кількість кадрів у спрайт-аркуші (припущення)
};
explosionSheet.img.src = "images/effects/explosion_96.png"; // ваш файл

// === Ігрові об'єкти ===
const player = { /* ... (ваш код) ... */ };
const bullets = [];
const enemies = [];
const explosions = [];

// === Функція спавну вибуху ===
function spawnExplosion(x, y) {
  explosions.push({
    x: x - explosionSheet.frameW / 2,
    y: y - explosionSheet.frameH / 2,
    frame: 0,
    frameTimer: 0,
    framesTotal: explosionSheet.frames
  });
}

// === Оновлення вибухів ===
function update(dt) {
  // ... (ваш код руху гравця, куль, ворогів) ...

  // Анімація вибухів
  explosions.forEach((explosion, index) => {
    explosion.frameTimer += dt;
    if (explosion.frameTimer >= 0.05) { // 20 FPS (швидкість анімації)
      explosion.frame++;
      explosion.frameTimer = 0;
      if (explosion.frame >= explosion.framesTotal) {
        explosions.splice(index, 1); // видалити завершений вибух
      }
    }
  });
}

// === Відрисовка вибухів ===
function draw() {
  // ... (ваш код фону, гравця, ворогів) ...

  // Вибухи
  explosions.forEach(explosion => {
    ctx.drawImage(
      explosionSheet.img,
      0,
      explosion.frame * explosionSheet.frameH, // зсув по Y для анімації
      explosionSheet.frameW,
      explosionSheet.frameH,
      explosion.x,
      explosion.y,
      explosionSheet.frameW * explosionSheet.scale,
      explosionSheet.frameH * explosionSheet.scale
    );
  });
}

// === Виклик вибуху при знищенні ворога ===
enemies.forEach((enemy, enemyIndex) => {
  bullets.forEach((bullet, bulletIndex) => {
    if (checkCollision(bullet, enemy)) {
      bullets.splice(bulletIndex, 1);
      enemy.hp--;
      if (enemy.hp <= 0) {
        spawnExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
        enemies.splice(enemyIndex, 1);
      }
    }
  });
});

// === Запуск гри ===
explosionSheet.img.onload = () => {
  // Автовизначення кількості кадрів (якщо спрайт вертикальний)
  explosionSheet.frames = Math.floor(explosionSheet.img.height / explosionSheet.frameH);
  gameLoop();
};
