const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let joystickStart = null;
let joystickMove = null;
let joystickRadius = 100;
let knobRadius = 30;
let joystickSensitivity = 0.08;

const player = {
  x: 0,
  y: 0,
  size: 30,
  speedX: 0,
  speedY: 0,
  maxSpeed: 4
};

// ▶️ Кнопка "Почати гру"
document.getElementById("startButton").addEventListener("click", () => {
  // Зчитуємо налаштування
  joystickSensitivity = parseFloat(document.getElementById("sensitivity").value);
  player.maxSpeed = parseFloat(document.getElementById("maxSpeed").value);

  // Приховуємо меню, показуємо canvas
  document.getElementById("menu").style.display = "none";
  canvas.style.display = "block";

  // Ініціалізуємо розміри
  canvas.width = innerWidth;
  canvas.height = innerHeight;

  player.x = canvas.width / 2;
  player.y = canvas.height / 2;

  loop(); // запускаємо гру
});

function drawPlayer() {
  ctx.fillStyle = "lime";
  ctx.beginPath();
  ctx.moveTo(player.x, player.y - player.size);
  ctx.lineTo(player.x - player.size / 1.5, player.y + player.size / 1.5);
  ctx.lineTo(player.x + player.size / 1.5, player.y + player.size / 1.5);
  ctx.closePath();
  ctx.fill();
}

function drawJoystick() {
  if (!joystickStart || !joystickMove) return;

  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(joystickStart.x, joystickStart.y, joystickRadius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ccc";
  ctx.beginPath();
  ctx.arc(joystickMove.x, joystickMove.y, knobRadius, 0, Math.PI * 2);
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
  drawJoystick();
  requestAnimationFrame(loop);
}

canvas.addEventListener("touchstart", (e) => {
  const t = e.touches[0];
  joystickStart = { x: t.clientX, y: t.clientY };
  joystickMove = { x: t.clientX, y: t.clientY };
});

canvas.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  joystickMove = { x: t.clientX, y: t.clientY };

  const dx = joystickMove.x - joystickStart.x;
  const dy = joystickMove.y - joystickStart.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const maxDistance = joystickRadius;

  const strength = Math.min(distance / maxDistance, 1);
  const angle = Math.atan2(dy, dx);

  player.speedX = Math.cos(angle) * player.maxSpeed * strength;
  player.speedY = Math.sin(angle) * player.maxSpeed * strength;

  joystickMove.x = joystickStart.x + Math.cos(angle) * Math.min(distance, maxDistance);
  joystickMove.y = joystickStart.y + Math.sin(angle) * Math.min(distance, maxDistance);
});

canvas.addEventListener("touchend", () => {
  joystickStart = null;
  joystickMove = null;
  player.speedX = 0;
  player.speedY = 0;
});
