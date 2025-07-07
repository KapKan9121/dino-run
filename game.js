// === Налаштування канвасу ===
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// === Гравець ===
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  speedX: 0,
  speedY: 0,
  width: 60,
  height: 60,
  image: new Image()
};
player.image.src = "images/player/player.png"; // заміни шлях на свій

// === Фон ===
const backgroundFar = new Image();
backgroundFar.src = "images/fon/layer_far.png"; // далекі зірки

//const backgroundNear = new Image();
//backgroundNear.src = "images/fon/layer_near.png"; // метеорити (з прозорим фоном)

let bgFarY = 0;
let bgNearY = 0;

// === Малювання гравця ===
function drawPlayer() {
  ctx.drawImage(
    player.image,
    player.x - player.width / 2,
    player.y - player.height / 2,
    player.width,
    player.height
  );
}

// === Оновлення гравця ===
function updatePlayer() {
  player.x += player.speedX;
  player.y += player.speedY;

  // межі
  player.x = Math.max(player.width / 2, Math.min(canvas.width - player.width / 2, player.x));
  player.y = Math.max(player.height / 2, Math.min(canvas.height - player.height / 2, player.y));
}

// === Малювання фону ===
function drawBackground() {
  // Далека частина фону
  bgFarY += 1.0;
  if (bgFarY >= canvas.height) bgFarY = 0;
  ctx.drawImage(backgroundFar, 0, bgFarY, canvas.width, canvas.height);
  ctx.drawImage(backgroundFar, 0, bgFarY - canvas.height, canvas.width, canvas.height);

  // Ближча частина фону (метеорити)
  //bgNearY += 1.3;
  //if (bgNearY >= canvas.height) bgNearY = 0;
  //ctx.drawImage(backgroundNear, 0, bgNearY, canvas.width, canvas.height);
  //ctx.drawImage(backgroundNear, 0, bgNearY - canvas.height, canvas.width, canvas.height);
}

// === Керування через сенсор ===
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

// === Основний цикл ===
function loop() {
  drawBackground();
  updatePlayer();
  drawPlayer();
  requestAnimationFrame(loop);
}

loop();

