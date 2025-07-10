// === Canvas Setup ===
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// === Game Variables ===
let bullets = [];
let enemies = [];
let kills = 0;

// === Player ===
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.8,
  w: 60,
  h: 60,
  speedX: 0,
  speedY: 0,
  image: new Image()
};
player.image.src = "images/player/player.png";

// === Background ===
const bgFar = new Image();
bgFar.src = "images/fon/layer_far.png";
let bgFarY = 0;

// === Enemy ===
const enemyImg = new Image();
enemyImg.src = "images/enemies/enemy1.png";

function spawnEnemy() {
  enemies.push({
    x: Math.random() * (canvas.width - 50),
    y: -60,
    w: 50,
    h: 50,
    vx: (Math.random() - 0.5) * 2,
    vy: 40,
    hp: 100,
    lastHit: 0
  });
}

// === Touch Control ===
let lastTouch = null;
let stopThreshold = 0.5;

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
  if (speed < stopThreshold) {
    player.speedX = 0;
    player.speedY = 0;
  } else {
    player.speedX = pxPerFrameX;
    player.speedY = pxPerFrameY;
  }

  lastTouch = { x: t.clientX, y: t.clientY, time: now };
});

canvas.addEventListener("touchend", () => {
  lastTouch = null;
  player.speedX = 0;
  player.speedY = 0;
});

// === Helpers ===
function drawBackground(dt) {
  bgFarY += 40 * dt;
  if (bgFarY > canvas.height) bgFarY = 0;
  ctx.drawImage(bgFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(bgFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);
}

function drawPlayer() {
  ctx.drawImage(player.image, player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);
}

function drawBullet(b) {
  ctx.fillStyle = "white";
  ctx.fillRect(b.x - 2, b.y, 4, 10);
}

function drawHP(e) {
  const hpW = 40;
  const percent = e.hp / 100;
  const barX = e.x + e.w / 2 - hpW / 2;
  const barY = e.y - 10;

  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(barX, barY, hpW, 6);
  ctx.fillStyle = "lime";
  ctx.fillRect(barX, barY, hpW * percent, 6);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, hpW, 6);
}

function drawKills() {
  ctx.fillStyle = "white";
  ctx.font = "16px sans-serif";
  ctx.fillText(`Kills: ${kills}`, 10, 20);
}

let lastTime = performance.now();
let shootTimer = 0;
function loop() {
  const now = performance.now();
  const dt = (now - lastTime) / 1000;
  lastTime = now;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground(dt);
  drawPlayer();

  // Update player
  player.x += player.speedX;
  player.y += player.speedY;
  player.x = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, player.x));
  player.y = Math.max(player.h / 2, Math.min(canvas.height - player.h / 2, player.y));

  // Shooting
  shootTimer += dt;
  if (shootTimer >= 0.3) {
    bullets.push({ x: player.x, y: player.y - 30 });
    shootTimer = 0;
  }

  // Bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.y -= 500 * dt;
    if (b.y < -10) bullets.splice(i, 1);
    else drawBullet(b);
  }

  // Enemies
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    const e = enemies[ei];
    e.x += e.vx * dt * 60;
    e.y += e.vy * dt;
    if (e.x < 0 || e.x + e.w > canvas.width) e.vx *= -1;
    ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);
    if (now - e.lastHit < 800) drawHP(e);

    // Bullet collision
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      if (
        b.x > e.x && b.x < e.x + e.w &&
        b.y > e.y && b.y < e.y + e.h
      ) {
        bullets.splice(bi, 1);
        e.hp -= 25;
        e.lastHit = now;
        if (e.hp <= 0) {
          enemies.splice(ei, 1);
          kills++;
        }
        break;
      }
    }

    // Player collision
    if (
      player.x + player.w/2 > e.x &&
      player.x - player.w/2 < e.x + e.w &&
      player.y + player.h/2 > e.y &&
      player.y - player.h/2 < e.y + e.h
    ) {
      location.reload();
    }

    if (e.y > canvas.height + e.h) enemies.splice(ei, 1);
  }

  drawKills();
  requestAnimationFrame(loop);
}

setInterval(spawnEnemy, 1200);
loop();
