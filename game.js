const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

// Гравець
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 30,
  speedX: 0,
  speedY: 0,
  maxSpeed: 10 // обмеження, щоб не було "вистрелу"
};

let lastTouch = null;

// Малюємо гравця як трикутник
function drawPlayer() {
  ctx.fillStyle = "lime";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.size);
  ctx.lineTo(player.x - player.size / 1.5, player.y + player.size / 1.5);
  ctx.lineTo(player.x + player.size / 1.5, player.y + player.size / 1.5);
  ctx.closePath();
  ctx.fill();
}

// Оновлюємо позицію гравця
function updatePlayer() {
  player.x += player.speedX;
  player.y += player.speedY;

  // межі екрану
  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

// Основний цикл
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  drawPlayer();
  requestAnimationFrame(loop);
}
loop();

// Торкання почалося
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  lastTouch = { x: t.clientX, y: t.clientY, time: performance.now() };
  player.speedX = 0;
  player.speedY = 0;
});

// Палець рухається — рахуємо швидкість
canvas.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  const now = performance.now();

  if (!lastTouch) return;

  const dx = t.clientX - lastTouch.x;
  const dy = t.clientY - lastTouch.y;
  const dt = now - lastTouch.time; // скільки мілісекунд пройшло

  const timeDelta = Math.max(dt, 1); // уникаємо ділення на нуль

  // Розрахунок швидкості (нормалізовано під 60fps)
  let speedX = dx / (timeDelta / 16.66);
  let speedY = dy / (timeDelta / 16.66);

  // Обмеження максимальної швидкості
  const speed = Math.sqrt(speedX ** 2 + speedY ** 2);
  if (speed > player.maxSpeed) {
    const ratio = player.maxSpeed / speed;
    speedX *= ratio;
    speedY *= ratio;
  }

  player.speedX = speedX;
  player.speedY = speedY;

  // Запам’ятовуємо нову точку
  lastTouch = { x: t.clientX, y: t.clientY, time: now };
});

// Палець відпущено — зупиняємось
canvas.addEventListener("touchend", () => {
  lastTouch = null;
  player.speedX = 0;
  player.speedY = 0;
});
