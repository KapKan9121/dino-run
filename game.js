// === Ініціалізація канвасу ===
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// === Завантаження зображень ===
const images = {
  player: new Image(),
  enemy: new Image(),
  explosion: new Image(),
  background: new Image()
};

images.player.src = "images/player/Maloc_Ranger_64.png";
images.explosion.src = "images/effects/explosion_96.png";
images.background.src = "images/fon/layer_far.png";
images.enemy.src = "images/enemy/asteroid.png";

// === Анімаційні параметри ===
const animations = {
  player: {
    frameW: 64,
    frameH: 64,
    totalFrames: 64,
    interval: 100,
    index: 0,
    timer: 0,
    orientation: 'vertical'
  },
  enemy: {
    frameW: 87,
    frameH: 64,
    totalFrames: 20,
    interval: 100,
    orientation: 'horizontal'
  },
  explosion: {
    frameW: 96,
    frameH: 96,
    totalFrames: 12,
    interval: 50,
    orientation: 'vertical'
  }
};

// === Налаштування колізій ===
const COLLISION_SCALE = {
  player: 0.7, // 70% від розміру гравця
  enemy: 0.8   // 80% від розміру ворога
};

// === Об'єкти ===
const player = {
  x: canvas.width / 2,
  y: canvas.height * 0.75,
  w: animations.player.frameW,
  h: animations.player.frameH,
  speedX: 0,
  speedY: 0,
  frame: 0,
  moveSpeed: 5
};

const bullets = [];
const enemies = [];
const explosions = [];

let score = 0;
let bgFarY = 0;
let lastTime = performance.now();

// === Сенсорне керування ===
let lastTouch = null;
let stopThreshold = 0.5;

// === Клавіатурне керування ===
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false
};

// === Функції ===
function gameLoop(now) {
  const deltaTime = now - lastTime;
  lastTime = now;

  update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // Оновлення позиції гравця
  let moveX = 0, moveY = 0;
  if (keys.ArrowLeft || keys.KeyA) moveX = -player.moveSpeed;
  if (keys.ArrowRight || keys.KeyD) moveX = player.moveSpeed;
  if (keys.ArrowUp || keys.KeyW) moveY = -player.moveSpeed;
  if (keys.ArrowDown || keys.KeyS) moveY = player.moveSpeed;

  player.x += moveX + player.speedX;
  player.y += moveY + player.speedY;

  // Обмеження руху
  player.x = Math.max(player.w / 2, Math.min(canvas.width - player.w / 2, player.x));
  player.y = Math.max(player.h / 2, Math.min(canvas.height - player.h / 2, player.y));

  // Анімація гравця
  animations.player.timer += dt;
  if (animations.player.timer >= animations.player.interval) {
    animations.player.timer = 0;
    animations.player.index = (animations.player.index + 1) % animations.player.totalFrames;
    player.frame = animations.player.index;
  }

  bgFarY += 100 * dt / 1000;
  if (bgFarY > canvas.height) bgFarY = 0;

  // Оновлення куль
  bullets.forEach((b, i) => {
    b.y -= 400 * dt / 1000;
    if (b.y < -10) bullets.splice(i, 1);
  });

  // Оновлення ворогів
  enemies.forEach((e, i) => {
    e.y += e.speed * dt / 1000;

    // Анімація кожного ворога
    e.timer += dt;
    if (e.timer >= animations.enemy.interval) {
      e.timer = 0;
      e.frame = (e.frame + 1) % animations.enemy.totalFrames;
    }

    if (e.y > canvas.height + e.h) enemies.splice(i, 1);

    // === Колізія з гравцем з урахуванням коефіцієнтів ===
    const pw = player.w * COLLISION_SCALE.player;
    const ph = player.h * COLLISION_SCALE.player;
    const ew = e.w * COLLISION_SCALE.enemy;
    const eh = e.h * COLLISION_SCALE.enemy;

    if (
      e.x < player.x + pw / 2 &&
      e.x + ew > player.x - pw / 2 &&
      e.y < player.y + ph / 2 &&
      e.y + eh > player.y - ph / 2
    ) {
      explosions.push({
        x: player.x,
        y: player.y,
        w: player.w * 1.5,
        h: player.h * 1.5,
        frame: 0,
        timer: 0
      });
      restartGame();
    }

    // === Колізія з кулями та адаптивний вибух ===
    bullets.forEach((b, j) => {
      if (
        b.x < e.x + ew &&
        b.x + b.w > e.x &&
        b.y < e.y + eh &&
        b.y + b.h > e.y
      ) {
        explosions.push({
          x: e.x + e.w / 2,
          y: e.y + e.h / 2,
          w: e.w * 1.2,
          h: e.h * 1.2,
          frame: 0,
          timer: 0
        });
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score++;
      }
    });
  });

  // Оновлення вибухів
  explosions.forEach((expl, i) => {
    expl.timer += dt;
    if (expl.timer >= animations.explosion.interval) {
      expl.timer = 0;
      expl.frame++;
      if (expl.frame >= animations.explosion.totalFrames) {
        explosions.splice(i, 1);
      }
    }
  });
}

function drawSprite(image, anim, x, y, w, h, frame) {
  const currentFrame = frame !== undefined ? frame : anim.index;
  if (anim.orientation === 'horizontal') {
    ctx.drawImage(
      image,
      currentFrame * anim.frameW, 0,
      anim.frameW, anim.frameH,
      x, y, w, h
    );
  } else {
    ctx.drawImage(
      image,
      0, currentFrame * anim.frameH,
      anim.frameW, anim.frameH,
      x, y, w, h
    );
  }
}

function draw() {
  // Очищення екрану
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Малювання фону
  ctx.drawImage(images.background, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(images.background, 0, bgFarY - canvas.height, canvas.width, canvas.height);

  // Малювання гравця
  drawSprite(
    images.player,
    animations.player,
    player.x - player.w / 2, player.y - player.h / 2,
    player.w, player.h,
    player.frame
  );

  // Малювання ворогів
  enemies.forEach(e => {
    drawSprite(
      images.enemy,
      animations.enemy,
      e.x, e.y,
      e.w, e.h,
      e.frame
    );
  });

  // Малювання куль
  bullets.forEach(b => {
    ctx.fillStyle = "white";
    ctx.fillRect(b.x, b.y, b.w, b.h);
  });

  // Малювання вибухів (адаптивних)
  explosions.forEach((expl) => {
    drawSprite(
      images.explosion,
      animations.explosion,
      expl.x - expl.w / 2,
      expl.y - expl.h / 2,
      expl.w, expl.h,
      expl.frame
    );
  });

  // Малювання рахунку
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
}

function restartGame() {
  score = 0;
  player.x = canvas.width / 2;
  player.y = canvas.height * 0.75;
  bullets.length = 0;
  enemies.length = 0;
  explosions.length = 0;
}

// === Обробники подій ===
window.addEventListener("keydown", (e) => {
  if (keys.hasOwnProperty(e.code)) keys[e.code] = true;
});

window.addEventListener("keyup", (e) => {
  if (keys.hasOwnProperty(e.code)) keys[e.code] = false;
});

canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  lastTouch = { x: t.clientX, y: t.clientY, time: performance.now() };
  player.speedX = 0;
  player.speedY = 0;
});

canvas.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  handleRelativeMove(t.clientX, t.clientY);
});

canvas.addEventListener("touchend", () => {
  lastTouch = null;
  player.speedX = 0;
  player.speedY = 0;
});

function handleRelativeMove(x, y) {
  const now = performance.now();
  if (!lastTouch) return;

  const dx = x - lastTouch.x;
  const dy = y - lastTouch.y;
  const dt = now - lastTouch.time;
  if (dt < 1) return;

  const pxPerFrameX = dx / (dt / 16.66);
  const pxPerFrameY = dy / (dt / 16.66);
  const speed = Math.sqrt(pxPerFrameX ** 2 + pxPerFrameY ** 2);

  player.speedX = speed < stopThreshold ? 0 : pxPerFrameX;
  player.speedY = speed < stopThreshold ? 0 : pxPerFrameY;

  lastTouch = { x, y, time: now };
}

// === Постріли ===
setInterval(() => {
  bullets.push({
    x: player.x,
    y: player.y - player.h / 2,
    w: 4,
    h: 10
  });
}, 250);

// === Спавн ворогів ===
setInterval(() => {
  enemies.push({
    x: Math.random() * (canvas.width - animations.enemy.frameW),
    y: -60,
    w: animations.enemy.frameW,
    h: animations.enemy.frameH,
    speed: 120 + Math.random() * 80,
    frame: 0,
    timer: 0
  });
}, 1000);

// === Запуск гри після завантаження зображень ===
let imagesLoaded = 0;
const totalImages = Object.keys(images).length;

function imageLoaded() {
  imagesLoaded++;
  if (imagesLoaded === totalImages) {
    console.log("Усі зображення завантажено");
    requestAnimationFrame(gameLoop);
  }
}

for (let key in images) {
  images[key].onload = imageLoaded;
}
