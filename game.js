const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Ресурси гри
const assets = {
  player: new Image(),
  background: new Image(),
  enemy: new Image(),
  explosion: new Image()
};

assets.player.src = 'images/player/player.png';
assets.background.src = 'images/fon/layer_far.png';
assets.enemy.src = 'images/enemy/enemy.png';
assets.explosion.src = 'images/effects/explosion_96.png';

// Налаштування вибуху
const explosionSettings = {
  width: 96,
  height: 96,
  frames: 8,
  frameDuration: 0.05,
  scale: 2
};

// Ігрові об'єкти
const game = {
  player: {
    x: canvas.width / 2,
    y: canvas.height * 0.75,
    width: 60,
    height: 60,
    speed: { x: 0, y: 0 }
  },
  bullets: [],
  enemies: [],
  explosions: [],
  score: 0,
  backgroundOffset: 0
};

// Функція створення вибуху
function createExplosion(x, y) {
  game.explosions.push({
    x: x - (explosionSettings.width * explosionSettings.scale) / 2,
    y: y - (explosionSettings.height * explosionSettings.scale) / 2,
    currentFrame: 0,
    timer: 0,
    active: true
  });
}

// Оновлення гри
function update(deltaTime) {
  // Рух гравця
  game.player.x += game.player.speed.x;
  game.player.y += game.player.speed.y;
  
  // Обмеження руху гравця
  game.player.x = Math.max(game.player.width/2, 
                         Math.min(canvas.width - game.player.width/2, game.player.x));
  game.player.y = Math.max(game.player.height/2, 
                         Math.min(canvas.height - game.player.height/2, game.player.y));

  // Рух фону
  game.backgroundOffset = (game.backgroundOffset + 100 * deltaTime) % canvas.height;

  // Рух куль
  for (let i = game.bullets.length - 1; i >= 0; i--) {
    game.bullets[i].y -= 400 * deltaTime;
    if (game.bullets[i].y < -10) game.bullets.splice(i, 1);
  }

  // Рух ворогів
  for (let i = game.enemies.length - 1; i >= 0; i--) {
    const enemy = game.enemies[i];
    enemy.y += enemy.speed * deltaTime;

    if (enemy.y > canvas.height + enemy.height) {
      game.enemies.splice(i, 1);
      continue;
    }

    // Колізія з кулями
    for (let j = game.bullets.length - 1; j >= 0; j--) {
      const bullet = game.bullets[j];
      if (checkCollision(bullet, enemy)) {
        enemy.health--;
        game.bullets.splice(j, 1);
        
        if (enemy.health <= 0) {
          createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
          game.enemies.splice(i, 1);
          game.score += 10;
          break;
        }
      }
    }
  }

  // Оновлення вибухів
  for (let i = game.explosions.length - 1; i >= 0; i--) {
    const explosion = game.explosions[i];
    explosion.timer += deltaTime;
    
    if (explosion.timer >= explosionSettings.frameDuration) {
      explosion.timer = 0;
      explosion.currentFrame++;
      
      if (explosion.currentFrame >= explosionSettings.frames) {
        game.explosions.splice(i, 1);
      }
    }
  }
}

// Перевірка колізій
function checkCollision(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// Відображення гри
function render() {
  // Очищення екрану
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Фон
  ctx.drawImage(assets.background, 0, game.backgroundOffset, canvas.width, canvas.height);
  ctx.drawImage(assets.background, 0, game.backgroundOffset - canvas.height, canvas.width, canvas.height);

  // Гравець
  ctx.drawImage(
    assets.player,
    game.player.x - game.player.width/2,
    game.player.y - game.player.height/2,
    game.player.width,
    game.player.height
  );

  // Кулі
  ctx.fillStyle = 'white';
  game.bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Вороги
  game.enemies.forEach(enemy => {
    ctx.drawImage(assets.enemy, enemy.x, enemy.y, enemy.width, enemy.height);
    
    // Відображення здоров'я
    if (enemy.health < enemy.maxHealth) {
      const segmentWidth = (enemy.width - (enemy.maxHealth - 1) * 2) / enemy.maxHealth;
      for (let i = 0; i < enemy.maxHealth; i++) {
        ctx.fillStyle = i < enemy.health ? 'red' : 'rgba(80,80,80,0.5)';
        ctx.fillRect(
          enemy.x + i * (segmentWidth + 2),
          enemy.y - 8,
          segmentWidth,
          3
        );
      }
    }
  });

  // Вибухи
  game.explosions.forEach(explosion => {
    ctx.drawImage(
      assets.explosion,
      0,
      explosion.currentFrame * explosionSettings.height,
      explosionSettings.width,
      explosionSettings.height,
      explosion.x,
      explosion.y,
      explosionSettings.width * explosionSettings.scale,
      explosionSettings.height * explosionSettings.scale
    );
  });

  // Рахунок
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${game.score}`, 20, 40);
}

// Основний цикл гри
let lastTime = 0;
function gameLoop(timestamp) {
  const deltaTime = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(deltaTime);
  render();
  requestAnimationFrame(gameLoop);
}

// Запуск гри після завантаження ресурсів
Promise.all(Object.values(assets).map(img => {
  return new Promise(resolve => {
    if (img.complete) resolve();
    else img.onload = resolve;
  });
}).then(() => {
  // Спавн куль
  setInterval(() => {
    game.bullets.push({
      x: game.player.x - 2,
      y: game.player.y - game.player.height/2,
      width: 4,
      height: 10
    });
  }, 250);

  // Спавн ворогів
  setInterval(() => {
    const width = 50;
    game.enemies.push({
      x: Math.random() * (canvas.width - width),
      y: -60,
      width: width,
      height: 50,
      speed: 120 + Math.random() * 80,
      health: 3,
      maxHealth: 3
    });
  }, 1000);

  // Початок гри
  requestAnimationFrame(gameLoop);
});
