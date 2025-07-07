let lastTouch = null;
let moveThreshold = 2; // якщо рух менше ніж 2px – вважаємо, що палець стоїть

canvas.addEventListener("touchstart", (e) => {
  const touch = e.touches[0];
  lastTouch = { x: touch.clientX, y: touch.clientY };
});

canvas.addEventListener("touchmove", (e) => {
  const touch = e.touches[0];
  const current = { x: touch.clientX, y: touch.clientY };

  const dx = current.x - lastTouch.x;
  const dy = current.y - lastTouch.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > moveThreshold) {
    const normX = dx / distance;
    const normY = dy / distance;
    player.dx = normX * player.speed;
    player.dy = normY * player.speed;
  } else {
    // палець стоїть — зупиняємось
    player.dx = 0;
    player.dy = 0;
  }

  lastTouch = current;
});

canvas.addEventListener("touchend", () => {
  player.dx = 0;
  player.dy = 0;
  lastTouch = null;
});
