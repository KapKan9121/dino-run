const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 30,
  speedX: 0,
  speedY: 0,
  maxSpeed: 4
};

let touchStart = null;
const deadZone = 5; // Поріг, нижче якого рух ігнорується

function drawPlayer() {
  ctx.fillStyle = "lime";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.size);
  ctx.lineTo(player.x - player.size / 1.5, player.y + player.size / 1.5);
  ctx.lineTo(player.x + player.size / 1.5, player.y + player.size / 1.5);
  ctx.closePath();
  ctx.fill();
}

function updatePlayer() {
  player.x += player.speedX;
  player.y += player.speedY;

  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  drawPlayer();
  requestAnimationFrame(loop);
}
loop();

// Коли палець торкнувся — запам’ятовуємо початкову позицію
canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY };
});

// Коли палець рухається — обчислюємо напрям і силу руху
canvas.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  if (!touchStart) return;

  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < deadZone) {
    player.speedX = 0;
    player.speedY = 0;
    return;
  }

  const angle = Math.atan2(dy, dx);
  const strength = Math.min(distance / 100, 1); // нормалізація

  player.speedX = Math.cos(angle) * player.maxSpeed * strength;
  player.speedY = Math.sin(angle) * player.maxSpeed * strength;
});

// Коли палець відпущено — повна зупинка
canvas.addEventListener("touchend", () => {
  touchStart = null;
  player.speedX = 0;
  player.speedY = 0;
});
