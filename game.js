<script>
// === Canvas init ===
const canvas = document.getElementById("canvas");
const ctx    = canvas.getContext("2d");
canvas.width  = innerWidth;
canvas.height = innerHeight;

// === Assets ===
const playerImg    = new Image();
playerImg.src      = "images/player/player.png";

const bgImg        = new Image();
bgImg.src          = "images/fon/layer_far.png";

const enemyImg     = new Image();
enemyImg.src       = "images/enemy/enemy.png";

// === Player ===
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  w: 60,
  h: 60,
  speedX: 0,
  speedY: 0
};

// === Arrays ===
const bullets = [];
const enemies = [];

// === Game vars ===
let bgY   = 0;
let score = 0;
let lastEnemySpawn = 0;

// === Touch control ===
let lastTouch = null;
const STOP_THRESHOLD = 0.5;

canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  lastTouch = { x: t.clientX, y: t.clientY, time: performance.now() };
  player.speedX = player.speedY = 0;
});

canvas.addEventListener("touchmove", e => {
  const t  = e.touches[0];
  const now = performance.now();
  if (!lastTouch) return;

  const dx = t.clientX - lastTouch.x;
  const dy = t.clientY - lastTouch.y;
  const dt = now - lastTouch.time;
  if (dt < 1) return;

  const vx = dx / (dt / 16.66);
  const vy = dy / (dt / 16.66);
  const sp = Math.hypot(vx, vy);

  if (sp < STOP_THRESHOLD) {
    player.speedX = player.speedY = 0;
  } else {
    player.speedX = vx;
    player.speedY = vy;
  }
  lastTouch = { x: t.clientX, y: t.clientY, time: now };
});

canvas.addEventListener("touchend", () => {
  lastTouch = null;
  player.speedX = player.speedY = 0;
});

// === Utility — rounded-rectangle fill ===
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// === Spawning ===
function spawnEnemy() {
  const w = 50, h = 50;
  enemies.push({
    x: Math.random() * (canvas.width - w),
    y: -60,
    w,  h,
    speed: 80 + Math.random() * 60,
    dirX: (Math.random() < 0.5 ? -1 : 1) * 40,   // горизонтальний дрейф
    hp: 3,
    maxHp: 3,
    showHp: false
  });
}

// === Shooting ===
setInterval(() => {
  bullets.push({ x: player.x, y: player.y - player.h / 2, w: 4, h: 10 });
}, 250);

// === Main loop ===
let lastT = performance.now();
Promise.all([playerImg, bgImg, enemyImg].map(img => new Promise(res => img.onload = res)))
  .then(() => requestAnimationFrame(loop));

function loop(now) {
  const dt = (now - lastT) / 1000;
  lastT = now;

  update(dt, now);
  draw();

  requestAnimationFrame(loop);
}

// === Update ===
function update(dt, now) {
  // background scroll
  bgY += 100 * dt;
  if (bgY > canvas.height) bgY = 0;

  // player physics
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, player.x));
  player.y = Math.max(player.h / 2, Math.min(canvas.height - player.h / 2, player.y));

  // bullets
  bullets.forEach((b, i) => {
    b.y -= 400 * dt;
    if (b.y < -b.h) bullets.splice(i, 1);
  });

  // enemies movement & collisions
  enemies.forEach((e, ei) => {
    e.y += e.speed * dt;
    e.x += e.dirX * dt;

    // відскок від боків
    if (e.x < 0 || e.x + e.w > canvas.width) e.dirX *= -1;

    // вихід за межі екрана
    if (e.y > canvas.height + e.h) enemies.splice(ei, 1);

    // зіткнення з гравцем
    if (
      e.x < player.x + player.w / 2 &&
      e.x + e.w > player.x - player.w / 2 &&
      e.y < player.y + player.h / 2 &&
      e.y + e.h > player.y - player.h / 2
    ) restartGame();

    // попадання куль
    bullets.forEach((b, bi) => {
      if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
        bullets.splice(bi, 1);
        e.hp--;
        e.showHp = true;          // вмикаємо шкалу
        if (e.hp <= 0) {
          enemies.splice(ei, 1);
          score++;
        }
      }
    });
  });

  // spawn logic
  if (now - lastEnemySpawn > 1200) {
    spawnEnemy();
    lastEnemySpawn = now;
  }
}
let lastEnemySpawn = performance.now();

// === Draw ===
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background
  ctx.drawImage(bgImg, 0, bgY, canvas.width, canvas.height);
  ctx.drawImage(bgImg, 0, bgY - canvas.height, canvas.width, canvas.height);

  // player
  ctx.drawImage(playerImg, player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);

  // bullets
  ctx.fillStyle = "white";
  bullets.forEach(b => ctx.fillRect(b.x - b.w / 2, b.y, b.w, b.h));

  // enemies + health bars
  enemies.forEach(e => {
    ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);

    if (e.showHp && e.hp < e.maxHp) {
      const ratio = e.hp / e.maxHp;
      const barW = e.w;
      const barH = 6;
      const x = e.x;
      const y = e.y - 8;

      // base
      ctx.fillStyle = "red";
      roundRect(ctx, x, y, barW, barH, barH / 2);
      ctx.fill();

      // current HP
      ctx.fillStyle = "lime";
      roundRect(ctx, x, y, barW * ratio, barH, barH / 2);
      ctx.fill();
    }
  });

  // score
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

// === Restart ===
function restartGame() {
  score = 0;
  bullets.length = 0;
  enemies.length = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
}
</script>
