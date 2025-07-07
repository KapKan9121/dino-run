const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Розміри canvas на весь екран
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Об'єкт куба
const cube = {
    x: canvas.width / 2 - 25,
    y: canvas.height / 2 - 25,
    size: 50,
    color: '#3498db',
    speed: 0,
    maxSpeed: 10,
    friction: 0.95,
    dx: 0,
    dy: 0
};

// Змінні для сенсорного керування
let touchX = 0;
let touchY = 0;
let isTouching = false;

// Слухачі подій для сенсорного керування
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchX = touch.clientX;
    touchY = touch.clientY;
    isTouching = true;
}

function handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    touchX = touch.clientX;
    touchY = touch.clientY;
}

function handleTouchEnd() {
    isTouching = false;
}

// Оновлення позиції куба
function update() {
    if (isTouching) {
        // Розраховуємо напрямок руху до пальця
        const targetX = touchX - cube.size / 2;
        const targetY = touchY - cube.size / 2;
        
        // Вектор напрямку
        cube.dx = targetX - cube.x;
        cube.dy = targetY - cube.y;
        
        // Нормалізуємо вектор (щоб швидкість була однакова в усіх напрямках)
        const distance = Math.sqrt(cube.dx * cube.dx + cube.dy * cube.dy);
        if (distance > 0) {
            cube.dx = cube.dx / distance * cube.maxSpeed;
            cube.dy = cube.dy / distance * cube.maxSpeed;
        }
    } else {
        // Гальмування, коли палець відірваний
        cube.dx *= cube.friction;
        cube.dy *= cube.friction;
    }
    
    // Оновлюємо позицію
    cube.x += cube.dx;
    cube.y += cube.dy;
    
    // Перевірка меж екрану
    if (cube.x < 0) cube.x = 0;
    if (cube.y < 0) cube.y = 0;
    if (cube.x > canvas.width - cube.size) cube.x = canvas.width - cube.size;
    if (cube.y > canvas.height - cube.size) cube.y = canvas.height - cube.size;
}

// Відмальовка гри
function draw() {
    // Очищення екрану
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Малюємо куб
    ctx.fillStyle = cube.color;
    ctx.fillRect(cube.x, cube.y, cube.size, cube.size);
}

// Головний цикл гри
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Запуск гри
gameLoop();
