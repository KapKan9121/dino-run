// === Ініціалізація канвасу ===
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;

// === Глобальні змінні ===
let gameOver = false;
let fireInterval = null;
let spawnInterval = null;
let allResourcesLoaded = false;

// === Сенсорне керування ===
let lastTouch = null;
let stopThreshold = 0.5;

// === Екран завантаження ===
const loadingScreen = document.createElement("div");
loadingScreen.style.position = "fixed";
loadingScreen.style.top = "0";
loadingScreen.style.left = "0";
loadingScreen.style.width = "100%";
loadingScreen.style.height = "100%";
loadingScreen.style.background = "#000";
loadingScreen.style.display = "flex";
loadingScreen.style.flexDirection = "column";
loadingScreen.style.alignItems = "center";
loadingScreen.style.justifyContent = "center";
loadingScreen.style.zIndex = "1000";
loadingScreen.style.color = "#fff";
loadingScreen.style.fontFamily = "Arial, sans-serif";

const loadingTitle = document.createElement("h1");
loadingTitle.textContent = "Space Shooter";
loadingTitle.style.fontSize = "3rem";
loadingTitle.style.marginBottom = "2rem";
loadingTitle.style.textShadow = "0 0 10px #00ffff";

const loadingBarContainer = document.createElement("div");
loadingBarContainer.style.width = "80%";
loadingBarContainer.style.maxWidth = "400px";
loadingBarContainer.style.height = "20px";
loadingBarContainer.style.background = "#333";
loadingBarContainer.style.borderRadius = "10px";
loadingBarContainer.style.overflow = "hidden";
loadingBarContainer.style.marginBottom = "1rem";

const loadingBar = document.createElement("div");
loadingBar.style.height = "100%";
loadingBar.style.width = "0%";
loadingBar.style.background = "linear-gradient(90deg, #0066ff, #00ffff)";
loadingBar.style.transition = "width 0.3s ease";
loadingBar.style.borderRadius = "10px";

const loadingText = document.createElement("div");
loadingText.textContent = "Завантаження 0%";
loadingText.style.fontSize = "1.2rem";
loadingText.style.marginBottom = "2rem";

const loadingTips = document.createElement("div");
loadingTips.textContent = "Порада: Уникайте астероїдів та знищуйте ворогів!";
loadingTips.style.fontSize = "1rem";
loadingTips.style.opacity = "0.7";

loadingBarContainer.appendChild(loadingBar);
loadingScreen.appendChild(loadingTitle);
loadingScreen.appendChild(loadingBarContainer);
loadingScreen.appendChild(loadingText);
loadingScreen.appendChild(loadingTips);
document.body.appendChild(loadingScreen);

// === Зірковий фон ===
const stars = [];
const STAR_COUNT = 150;
for (let i = 0; i < STAR_COUNT; i++) {
  stars.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 1,
    speed: Math.random() * 0.5 + 0.2,
    opacity: Math.random() * 0.5 + 0.5
  });
}

function updateStars(dt) {
  stars.forEach(star => {
    star.y += star.speed * dt * 0.4;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
      star.size = Math.random() * 2 + 1;
      star.speed = Math.random() * 0.5 + 0.2;
    }
  });
}

function drawStars() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  stars.forEach(star => {
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${star.opacity})`;
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

// === Аудіо система ===
const Game = {};
Game.Audio = {
  _supported: !!window.Audio && !(navigator.userAgent.match(/linux/i) && navigator.userAgent.match(/firefox/i)),
  play: function(name) {
    if (!this._supported) return;
    const a = new Audio();
    const ext = (a.canPlayType("audio/ogg") ? "ogg" : "mp3");
    a.src = "sfx/" + name + "." + ext;
    a.volume = 0.7;
    a.play();
  }
};

// === Конфігурація кораблів ===
const shipsConfig = {
  ranger: {
    shipName: "Ranger",
    frameW: 64,
    frameH: 64,
    totalFrames: 64,
    interval: 100,
    orientation: 'vertical',
    collisionScale: 0.8,
    bulletColor: "red",
    bulletSize: 50,
    bulletDamage: 10,
    fireRate: 250,
    hp: 150,
    moveSpeed: 5,
    speedX: 0,
    speedY: 0
  },
  predator: {
    shipName: "Predator",
    frameW: 64,
    frameH: 64,
    totalFrames: 64,
    interval: 100,
    orientation: 'vertical',
    collisionScale: 0.8,
    bulletColor: "red",
    bulletSize: 50,
    bulletDamage: 15,
    fireRate: 300,
    hp: 200,
    moveSpeed: 4,
    speedX: 0,
    speedY: 0
  }
};

// === Конфігурація ворогів ===
const enemiesConfig = {
  asteroid: {
    sprite: "asteroid",
    frameW: 232,
    frameH: 171,
    totalFrames: 20,
    interval: 100,
    orientation: 'horizontal',
    scale: 0.4,
    collisionScale: 0.4,
    hp: 50,
    damage: 50,
    speedMin: 120,
    speedMax: 200,
    canShoot: false
  },
  enemy: {
    sprite: "enemy",
    frameW: 194,
    frameH: 240,
    totalFrames: 27,
    interval: 100,
    orientation: 'horizontal',
    scale: 0.3,
    collisionScale: 0.3,
    hp: 120,
    damage: 50,
    speedMin: 60,
    speedMax: 120,
    canShoot: true,
    bulletColor: "red1",
    bulletSize: 20,
    bulletSpeed: 250,
    fireRate: 1500
  }
};

// === Завантаження ресурсів ===
const resources = {
  images: {},
  sounds: {}
};

// Список всіх зображень для завантаження
const imageAssets = [
  { name: "explosion", path: "images/effects/explosion_96.png" },
  { name: "ranger", path: "images/player/Ranger_64.png" },
  { name: "predator", path: "images/player/Predator_64.png" },
  { name: "asteroid", path: "images/enemy/asteroid.png" },
  { name: "enemy", path: "images/enemy/enemy.png" },
  { name: "plasma-red", path: "images/bullets/plasma-red.png" },
  { name: "plasma-red1", path: "images/bullets/plasma-red1.png" }
];

// Список всіх звуків для завантаження
const soundAssets = [
  { name: "shot", path: "sfx/shot" },
  { name: "explosion", path: "sfx/explosion" }
];

let loadedCount = 0;
const totalResources = imageAssets.length + soundAssets.length;

function updateProgress() {
  loadedCount++;
  const progress = Math.round((loadedCount / totalResources) * 100);
  loadingBar.style.width = `${progress}%`;
  loadingText.textContent = `Завантаження ${progress}%`;
  
  if (loadedCount === totalResources) {
    setTimeout(() => {
      loadingScreen.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(loadingScreen);
        allResourcesLoaded = true;
        showShipSelection();
      }, 500);
    }, 500);
  }
}

// Завантаження зображень
imageAssets.forEach(asset => {
  resources.images[asset.name] = new Image();
  resources.images[asset.name].onload = updateProgress;
  resources.images[asset.name].onerror = () => {
    console.error(`Помилка завантаження зображення: ${asset.path}`);
    updateProgress();
  };
  resources.images[asset.name].src = asset.path;
});

// Завантаження звуків (перевірка тільки підтримки, реальне завантаження буде при використанні)
soundAssets.forEach(asset => {
  if (Game.Audio._supported) {
    const a = new Audio();
    const ext = a.canPlayType("audio/ogg") ? ".ogg" : ".mp3";
    a.src = asset.path + ext;
    a.load();
    a.addEventListener('canplaythrough', updateProgress);
    a.addEventListener('error', () => {
      console.error(`Помилка завантаження звуку: ${asset.path}`);
      updateProgress();
    });
    resources.sounds[asset.name] = a;
  } else {
    updateProgress();
  }
});

// === Вибір корабля ===
let selectedShip = null;
function showShipSelection() {
  if (!allResourcesLoaded) return;

  const menu = document.createElement("div");
  menu.style.position = "absolute";
  menu.style.top = "50%";
  menu.style.left = "50%";
  menu.style.transform = "translate(-50%, -50%)";
  menu.style.background = "rgba(0,0,0,0.8)";
  menu.style.color = "#fff";
  menu.style.padding = "30px";
  menu.style.borderRadius = "10px";
  menu.style.textAlign = "center";
  menu.style.boxShadow = "0 0 20px rgba(0, 255, 255, 0.5)";
  menu.style.border = "1px solid #00ffff";

  const title = document.createElement("h2");
  title.innerText = "Вибери корабель:";
  title.style.fontSize = "2rem";
  title.style.marginBottom = "20px";
  title.style.textShadow = "0 0 10px #00ffff";
  menu.appendChild(title);

  const shipsContainer = document.createElement("div");
  shipsContainer.style.display = "flex";
  shipsContainer.style.justifyContent = "center";
  shipsContainer.style.gap = "20px";
  shipsContainer.style.flexWrap = "wrap";
  shipsContainer.style.marginBottom = "20px";

  for (let shipKey in shipsConfig) {
    const shipContainer = document.createElement("div");
    shipContainer.style.display = "flex";
    shipContainer.style.flexDirection = "column";
    shipContainer.style.alignItems = "center";
    
    const btn = document.createElement("button");
    btn.innerText = shipsConfig[shipKey].shipName;
    btn.style.padding = "10px 20px";
    btn.style.margin = "10px";
    btn.style.background = "linear-gradient(90deg, #0066ff, #00ffff)";
    btn.style.color = "#fff";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.fontSize = "1.2rem";
    btn.style.transition = "transform 0.2s, box-shadow 0.2s";
    
    btn.onmouseover = () => {
      btn.style.transform = "scale(1.05)";
      btn.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.7)";
    };
    
    btn.onmouseout = () => {
      btn.style.transform = "scale(1)";
      btn.style.boxShadow = "none";
    };
    
    btn.onclick = () => {
      selectedShip = new Ship(shipsConfig[shipKey]);
      document.body.removeChild(menu);
      startGame();
    };

    const shipPreview = document.createElement("div");
    shipPreview.style.width = "100px";
    shipPreview.style.height = "100px";
    shipPreview.style.background = `url(${resources.images[shipKey.toLowerCase()].src}) center/contain no-repeat`;
    
    shipContainer.appendChild(shipPreview);
    shipContainer.appendChild(btn);
    shipsContainer.appendChild(shipContainer);
  }

  menu.appendChild(shipsContainer);
  document.body.appendChild(menu);
}

// === Клас Ship ===
class Ship {
  constructor(config) {
    this.config = config;
    this.x = canvas.width / 2;
    this.y = canvas.height * 0.75;
    this.w = config.frameW;
    this.h = config.frameH;
    this.frame = 0;
    this.timer = 0;
    this.forward = true;
    this.hp = config.hp;
    this.moveSpeed = config.moveSpeed;
    this.speedX = 0;
    this.speedY = 0;

    this.image = resources.images[config.shipName.toLowerCase()];
  }

  update(dt) {
    this.timer += dt;
    if (this.timer >= this.config.interval) {
      this.timer = 0;
      if (this.forward) {
        this.frame++;
        if (this.frame >= this.config.totalFrames - 1) {
          this.frame = this.config.totalFrames - 1;
          this.forward = false;
        }
      } else {
        this.frame--;
        if (this.frame <= 0) {
          this.frame = 0;
          this.forward = true;
        }
      }
    }
  }

  draw() {
    drawSprite(this.image, this.config, this.x - this.w/2, this.y - this.h/2, this.w, this.h, this.frame);
  }

  fire() {
    bullets.push({
      x: this.x - this.config.bulletSize / 2,
      y: this.y - this.h / 2 - this.config.bulletSize,
      w: this.config.bulletSize,
      h: this.config.bulletSize,
      damage: this.config.bulletDamage,
      img: resources.images[`plasma-${this.config.bulletColor}`].src
    });
    Game.Audio.play("shot");
  }
}

// === Функція для малювання HP бару з заокругленими краями ===
function drawHpBar(enemy) {
    const barWidth = enemy.w * 0.6;
    const barHeight = 4;
    const x = enemy.x + (enemy.w - barWidth) / 2;
    const y = enemy.y - 8;
    const radius = 2;

    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, radius);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fill();

    const hpPercent = enemy.hp / enemy.config.hp;
    const fillWidth = barWidth * hpPercent;
    
    if (fillWidth > 0) {
        ctx.beginPath();
        if (fillWidth >= barWidth - radius * 2) {
            ctx.roundRect(x, y, fillWidth, barHeight, radius);
        } else {
            ctx.rect(x, y, fillWidth - radius, barHeight);
            ctx.arc(x + fillWidth, y + radius, radius, Math.PI * 1.5, Math.PI * 0.5, false);
            ctx.arc(x + fillWidth, y + barHeight - radius, radius, Math.PI * 0.5, Math.PI * 1.5, false);
            ctx.lineTo(x, y + barHeight);
        }
        
        if (hpPercent > 0.6) {
            ctx.fillStyle = '#00ff00';
        } else if (hpPercent > 0.3) {
            ctx.fillStyle = '#ffff00';
        } else {
            ctx.fillStyle = '#ff0000';
        }
        ctx.fill();
    }

    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, radius);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
}

// === Клас Enemy ===
class Enemy {
    constructor(config) {
        this.config = config;
        this.x = Math.random() * (canvas.width - config.frameW * config.scale);
        this.y = -config.frameH;
        this.w = config.frameW * config.scale;
        this.h = config.frameH * config.scale;
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.frame = 0;
        this.timer = 0;
        this.speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
        this.id = Math.random().toString(36).substr(2, 9);
        this.lastDamageTime = 0;
        this.showHpBar = false;

        this.image = resources.images[config.sprite];

        if (config.canShoot) {
            this.lastFire = 0;
        }
    }

    update(dt) {
        this.y += this.speed * dt / 1000;
        this.timer += dt;
        if (this.timer >= this.config.interval) {
            this.timer = 0;
            this.frame = (this.frame + 1) % this.config.totalFrames;
        }

        if (this.config.canShoot) {
            this.lastFire += dt;
            if (this.lastFire >= this.config.fireRate) {
                this.fire();
                this.lastFire = 0;
            }
        }

        if (this.showHpBar) {
            this.lastDamageTime += dt;
            if (this.lastDamageTime > 1000) {
                this.showHpBar = false;
            }
        }
    }

    takeDamage(damage) {
        this.hp -= damage;
        this.showHpBar = true;
        this.lastDamageTime = 0;
    }

    fire() {
        enemyBullets.push({
            x: this.x + this.w / 2 - this.config.bulletSize / 2,
            y: this.y + this.h / 2,
            w: this.config.bulletSize,
            h: this.config.bulletSize,
            speed: this.config.bulletSpeed,
            img: resources.images[`plasma-${this.config.bulletColor}`].src,
            damage: 20
        });
        Game.Audio.play("shot");
    }

    draw() {
        drawSprite(this.image, this.config, this.x, this.y, this.w, this.h, this.frame);
        if (this.showHpBar) {
            drawHpBar(this);
        }
    }
}

// === Анімації ===
const animations = {
  explosion: {
    frameW: 96,
    frameH: 96,
    totalFrames: 12,
    interval: 50,
    orientation: 'vertical'
  }
};

const bullets = [];
const enemyBullets = [];
const enemies = [];
const explosions = [];

let score = 0;
let lastTime = performance.now();

// === Клавіатура ===
const keys = {
  ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
  KeyW: false, KeyA: false, KeyS: false, KeyD: false
};

// === Екран смерті ===
function gameOverScreen() {
  gameOver = true;
  clearInterval(fireInterval);
  clearInterval(spawnInterval);

  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.8)";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.color = "#fff";
  overlay.style.fontSize = "24px";
  overlay.style.zIndex = "1000";

  const gameOverText = document.createElement("h2");
  gameOverText.textContent = "Гру закінчено";
  gameOverText.style.fontSize = "3rem";
  gameOverText.style.marginBottom = "1rem";
  gameOverText.style.textShadow = "0 0 10px #ff0000";

  const scoreText = document.createElement("p");
  scoreText.textContent = `Score: ${score}`;
  scoreText.style.fontSize = "2rem";
  scoreText.style.marginBottom = "2rem";

  const restartBtn = document.createElement("button");
  restartBtn.textContent = "🔄 Restart";
  restartBtn.style.padding = "10px 30px";
  restartBtn.style.margin = "10px";
  restartBtn.style.background = "linear-gradient(90deg, #ff3300, #ff9900)";
  restartBtn.style.color = "#fff";
  restartBtn.style.border = "none";
  restartBtn.style.borderRadius = "5px";
  restartBtn.style.cursor = "pointer";
  restartBtn.style.fontSize = "1.2rem";
  restartBtn.style.transition = "transform 0.2s";
  
  restartBtn.onmouseover = () => {
    restartBtn.style.transform = "scale(1.05)";
  };
  
  restartBtn.onmouseout = () => {
    restartBtn.style.transform = "scale(1)";
  };
  
  restartBtn.onclick = () => {
    document.body.removeChild(overlay);
    restartGame();
  };

  const backBtn = document.createElement("button");
  backBtn.textContent = "⬅ Back to Menu";
  backBtn.style.padding = "10px 30px";
  backBtn.style.margin = "10px";
  backBtn.style.background = "linear-gradient(90deg, #0066ff, #00ccff)";
  backBtn.style.color = "#fff";
  backBtn.style.border = "none";
  backBtn.style.borderRadius = "5px";
  backBtn.style.cursor = "pointer";
  backBtn.style.fontSize = "1.2rem";
  backBtn.style.transition = "transform 0.2s";
  
  backBtn.onmouseover = () => {
    backBtn.style.transform = "scale(1.05)";
  };
  
  backBtn.onmouseout = () => {
    backBtn.style.transform = "scale(1)";
  };
  
  backBtn.onclick = () => {
    document.body.removeChild(overlay);
    selectedShip = null;
    enemies.length = 0;
    bullets.length = 0;
    explosions.length = 0;
    score = 0;
    showShipSelection();
  };

  overlay.appendChild(gameOverText);
  overlay.appendChild(scoreText);
  overlay.appendChild(restartBtn);
  overlay.appendChild(backBtn);
  document.body.appendChild(overlay);
}

// === Рестарт гри ===
function restartGame() {
  gameOver = false;
  score = 0;
  enemies.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  explosions.length = 0;

  selectedShip.x = canvas.width / 2;
  selectedShip.y = canvas.height * 0.75;
  selectedShip.hp = selectedShip.config.hp;
  selectedShip.speedX = 0;
  selectedShip.speedY = 0;

  clearInterval(fireInterval);
  clearInterval(spawnInterval);

  fireInterval = setInterval(() => {
    if (selectedShip && !gameOver) selectedShip.fire();
  }, selectedShip.config.fireRate);

  spawnInterval = setInterval(() => {
    const keys = Object.keys(enemiesConfig);
    const type = keys[Math.floor(Math.random() * keys.length)];
    enemies.push(new Enemy(enemiesConfig[type]));
  }, 1000);

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// === Старт гри ===
function startGame() {
  score = 0;
  gameOver = false;
  enemies.length = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  explosions.length = 0;

  fireInterval = setInterval(() => {
    if (selectedShip && !gameOver) selectedShip.fire();
  }, selectedShip.config.fireRate);

  spawnInterval = setInterval(() => {
    const keys = Object.keys(enemiesConfig);
    const type = keys[Math.floor(Math.random() * keys.length)];
    enemies.push(new Enemy(enemiesConfig[type]));
  }, 1000);

  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

function gameLoop(now) {
  const deltaTime = now - lastTime;
  lastTime = now;

  update(deltaTime);
  draw();
  if (!gameOver) requestAnimationFrame(gameLoop);
}

function update(dt) {
  if (!selectedShip || gameOver) return;

  selectedShip.update(dt);
  updateStars(dt);

  let moveX = 0, moveY = 0;
  if (keys.ArrowLeft || keys.KeyA) moveX = -selectedShip.moveSpeed;
  if (keys.ArrowRight || keys.KeyD) moveX = selectedShip.moveSpeed;
  if (keys.ArrowUp || keys.KeyW) moveY = -selectedShip.moveSpeed;
  if (keys.ArrowDown || keys.KeyS) moveY = selectedShip.moveSpeed;

  selectedShip.x += moveX + selectedShip.speedX;
  selectedShip.y += moveY + selectedShip.speedY;

  selectedShip.x = Math.max(selectedShip.w / 2, Math.min(canvas.width - selectedShip.w / 2, selectedShip.x));
  selectedShip.y = Math.max(selectedShip.h / 2, Math.min(canvas.height - selectedShip.h / 2, selectedShip.y));

  bullets.forEach((b, i) => {
    b.y -= 400 * dt / 1000;
    if (b.y < -b.h) bullets.splice(i, 1);
  });

  enemyBullets.forEach((b, i) => {
    b.y += b.speed * dt / 1000;
    if (b.y > canvas.height) enemyBullets.splice(i, 1);

    if (
      b.x < selectedShip.x + selectedShip.w / 2 &&
      b.x + b.w > selectedShip.x - selectedShip.w / 2 &&
      b.y < selectedShip.y + selectedShip.h / 2 &&
      b.y + b.h > selectedShip.y - selectedShip.h / 2
    ) {
      selectedShip.hp -= 20;
      enemyBullets.splice(i, 1);
      if (selectedShip.hp <= 0) gameOverScreen();
    }
  });

  enemies.forEach((e, i) => {
    e.update(dt);

    if (e.y > canvas.height + e.h) enemies.splice(i, 1);

    bullets.forEach((b, j) => {
      if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
        e.takeDamage(b.damage);
        bullets.splice(j, 1);

        if (e.hp <= 0) {
          explosions.push({
            x: e.x + e.w / 2, y: e.y + e.h / 2,
            w: e.w * 1.2, h: e.h * 1.2,
            frame: 0, timer: 0
          });
          Game.Audio.play("explosion");
          enemies.splice(i, 1);
          score++;
        }
      }
    });

    const pw = selectedShip.w * selectedShip.config.collisionScale;
    const ph = selectedShip.h * selectedShip.config.collisionScale;
    const ew = e.w * e.config.collisionScale;
    const eh = e.h * e.config.collisionScale;

    if (
      e.x < selectedShip.x + pw / 2 &&
      e.x + ew > selectedShip.x - pw / 2 &&
      e.y < selectedShip.y + ph / 2 &&
      e.y + eh > selectedShip.y - ph / 2
    ) {
      selectedShip.hp -= e.config.damage;
      explosions.push({
        x: selectedShip.x,
        y: selectedShip.y,
        w: selectedShip.w * 1.5,
        h: selectedShip.h * 1.5,
        frame: 0,
        timer: 0
      });
      Game.Audio.play("explosion");
      enemies.splice(i, 1);

      if (selectedShip.hp <= 0) gameOverScreen();
    }
  });

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

// === Малювання ===
function drawSprite(image, anim, x, y, w, h, frame) {
  const currentFrame = frame || 0;
  if (anim.orientation === 'horizontal') {
    ctx.drawImage(image, currentFrame * anim.frameW, 0, anim.frameW, anim.frameH, x, y, w, h);
  } else {
    ctx.drawImage(image, 0, currentFrame * anim.frameH, anim.frameW, anim.frameH, x, y, w, h);
  }
}

function draw() {
  drawStars();

  if (selectedShip) selectedShip.draw();

  enemies.forEach(e => e.draw());
  bullets.forEach(b => {
    const img = resources.images[b.img.split('/').pop().split('.')[0]];
    ctx.drawImage(img, b.x, b.y, b.w, b.h);
  });

  enemyBullets.forEach(b => {
    const img = resources.images[b.img.split('/').pop().split('.')[0]];
    ctx.drawImage(img, b.x, b.y, b.w, b.h);
  });

  explosions.forEach(expl => drawSprite(resources.images.explosion, animations.explosion, 
    expl.x - expl.w / 2, expl.y - expl.h / 2, expl.w, expl.h, expl.frame));

  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 30);
  if (selectedShip) ctx.fillText("HP: " + selectedShip.hp, 10, 60);
}

// === Обробники подій ===
window.addEventListener("keydown", (e) => { if (keys.hasOwnProperty(e.code)) keys[e.code] = true; });
window.addEventListener("keyup", (e) => { if (keys.hasOwnProperty(e.code)) keys[e.code] = false; });

// === Сенсорне керування ===
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  const t = e.touches[0];
  lastTouch = { x: t.clientX, y: t.clientY, time: performance.now() };
  if (selectedShip) {
    selectedShip.speedX = 0;
    selectedShip.speedY = 0;
  }
});

canvas.addEventListener("touchmove", (e) => {
  e.preventDefault();
  const t = e.touches[0];
  handleRelativeMove(t.clientX, t.clientY);
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  lastTouch = null;
  if (selectedShip) {
    selectedShip.speedX = 0;
    selectedShip.speedY = 0;
  }
});

function handleRelativeMove(x, y) {
  if (!selectedShip) return;
  
  const now = performance.now();
  if (!lastTouch) return;

  const dx = x - lastTouch.x;
  const dy = y - lastTouch.y;
  const dt = now - lastTouch.time;
  if (dt < 1) return;

  const pxPerFrameX = dx / (dt / 16.66);
  const pxPerFrameY = dy / (dt / 16.66);
  const speed = Math.sqrt(pxPerFrameX ** 2 + pxPerFrameY ** 2);

  selectedShip.speedX = speed < stopThreshold ? 0 : pxPerFrameX;
  selectedShip.speedY = speed < stopThreshold ? 0 : pxPerFrameY;

  lastTouch = { x, y, time: now };
}
