// === Завантаження зображень ===
const explosionSheet = {
  img: new Image(),
  frameW: 28,          // ширина одного кадру у спрайті
  frameH: 28,          // висота одного кадру
  frames: 0            // кількість кадрів (рахуємо після onload)
};
explosionSheet.img.src = "images/effects/explosion_96.png";
explosionSheet.img.onload = () => {
  explosionSheet.frames = explosionSheet.img.height / explosionSheet.frameH;
};

// === Масив активних вибухів ===
const explosions = [];

/* -------------------------------------------------
   КОЛИ ВОРОГ ЗНИЩЕНИЙ — ДОДАЄМО ВИБУХ
   ------------------------------------------------- */
function spawnExplosion(x, y) {
  explosions.push({
    x: x - explosionSheet.frameW / 2,     // центруємо
    y: y - explosionSheet.frameH / 2,
    frame: 0,
    frameTimer: 0                         // лічильник часу для переходу кадру
  });
}

/* -------------------------------------------------
   ОНОВЛЕННЯ ІГРОВОЇ ЛОГІКИ
   ------------------------------------------------- */
function update(dt) {
  /* ...ваш існуючий код... */

  enemies.forEach((e, i) => {
    /* ...колізії... */

    bullets.forEach((b, j) => {
      if (/* колізія */) {
        e.hp--;
        bullets.splice(j, 1);
        if (e.hp <= 0) {
          // Спавнимо вибух у центрі ворога
          spawnExplosion(e.x + e.width / 2, e.y + e.height / 2);
          enemies.splice(i, 1);
          score++;
        }
      }
    });
  });

  /* === ОНОВЛЕННЯ ВИБУХІВ === */
  explosions.forEach((ex, idx) => {
    const frameDuration = 0.04;          // скільки секунд показуємо один кадр (~25 FPS)
    ex.frameTimer += dt;
    if (ex.frameTimer >= frameDuration) {
      ex.frame++;
      ex.frameTimer = 0;
      if (ex.frame >= explosionSheet.frames) {
        explosions.splice(idx, 1);       // анімація закінчилася
      }
    }
  });
}

/* -------------------------------------------------
   МАЛЮВАННЯ
   ------------------------------------------------- */
function draw() {
  /* ...ваш існуючий код... */

  /* === Малюємо вибухи поверх усього === */
  explosions.forEach(ex => {
    ctx.drawImage(
      explosionSheet.img,
      0,                                     // srcX – кадри у стовпчик
      ex.frame * explosionSheet.frameH,      // srcY
      explosionSheet.frameW,
      explosionSheet.frameH,
      ex.x,
      ex.y,
      explosionSheet.frameW,                 // можете збільшити, напр. *2 для ефекту
      explosionSheet.frameH
    );
  });

  /* ...рахунок тощо... */
}

/* -------------------------------------------------
   Додаємо вибух у список ресурсів, які треба завантажити
   ------------------------------------------------- */
Promise.all([
  new Promise(res => playerImg.onload = res),
  new Promise(res => backgroundFar.onload = res),
  new Promise(res => enemyImg.onload = res),
  new Promise(res => explosionSheet.img.onload = res)   // <- додано
]).then(() => requestAnimationFrame(gameLoop));
