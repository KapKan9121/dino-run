const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

// Гравець — трикутник
const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  size: 30,
  speedX: 0,
  speedY: 0,
  maxSpeed: 4
};

let joystickStart = null;
let joystickMove = null;

// Малюємо гравця (трикутник)
function drawPlayer() {
  ctx.fillStyle = "lime";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.size);
  ctx.lineTo(player.x - player.size / 1.5, player.y + player.size / 1.5);
  ctx.lineTo(player.x + player.size / 1.5, player.y + player.size / 1.5);
  ctx.closePath();
  ctx.fill();
}

// Малюємо джойстик
function drawJoystick() {
  if (!joystickStart || !joystickMove) return;

  const baseX = joystickStart.x;
  const baseY = joystickStart.y;
  const knobX = joystickMove.x;
  const knobY = joystickMove.y;

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(baseX, baseY, 40, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ccc";
  ctx.beginPath();
  ctx.arc(knobX, knobY, 20, 0, Math.PI * 2);
  ctx.fill();
}

// Оновлення позиції гравця
function updatePlayer() {
  player.x += player.speedX;
  player.y += player.speedY;

  // Межі
  player.x = Math.max(player.size, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(player.size, Math.min(canvas.height - player.size, player.y));
}

// Основний цикл
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  drawPlayer();
  drawJoystick();
  requestAnimationFrame(loop);
}
loop();

// Торкання
canvas.addEventListener("touchstart", e => {
  const t = e.touches[0];
  joystickStart = { x: t.clientX, y: t.clientY };
  joystickMove = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchmove", e => {
  const t = e.touches[0];
  joystickMove = { x: t.clientX, y: t.clientY };

  const dx = joystickMove.x - joystickStart.x;
  const dy = joystickMove.y - joystickStart.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const maxDistance = 40;

  // нормалізований вектор
  let normX = dx / distance;
  let normY = dy / distance;

  // якщо палка в межах круга
  if (distance < maxDistance) {
    player.speedX = dx * 0.1;
    player.speedY = dy * 0.1;
  } else {
    player.speedX = normX * player.maxSpeed;
    player.speedY = normY * player.maxSpeed;

    // обмеження довжини палки
    joystickMove.x = joystickStart.x + normX * maxDistance;
    joystickMove.y = joystickStart.y + normY * maxDistance;
  }
});

canvas.addEventListener("touchend", () => {
  joystickStart = null;
  joystickMove = null;
  player.speedX = 0;
  player.speedY = 0;
});
