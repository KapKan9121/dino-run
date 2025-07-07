const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Налаштування Canvas
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
    lastTouchX: 0,
    lastTouchY: 0,
    isMoving: false
};

// Змінні для руху
let touchOffsetX = 0;
let touchOffsetY = 0;

// Слухачі подій
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    
    // Запам'ятовуємо початкові координати дотику
    cube.lastTouchX = touch.clientX;
    cube.lastTouchY = touch.clientY;
    
    // Перевіряємо, чи торкнулися куба
    const isTouchingCube = (
        touch.clientX >= cube.x &&
        touch.clientX <= cube.x + cube.size &&
        touch.clientY >= cube.y &&
        touch.clientY <= cube.y + cube.size
    );
    
    if (isTouchingCube) {
        cube.isMoving = true;
        // Запам'ятовуємо зміщення пальця відносно куба
        touchOffsetX = touch.clientX - cube.x;
        touchOffsetY = touch.clientY - cube.y;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!cube.isMoving) return;
    
    const touch = e.touches[0];
    
    // Оновлюємо позицію куба з урахуванням зміщення
    cube.x = touch.clientX - touchOffsetX;
    cube.y = touch.clientY - touchOffsetY;
    
    // Запам'ятовуємо останні координати для плавності
    cube.lastTouchX = touch.clientX;
    cube.lastTouchY = touch.clientY;
    
    // Обмеження меж екрану
    cube.x = Math.max(0, Math.min(cube.x, canvas.width - cube.size));
    cube.y = Math.max(0, Math.min(cube.y, canvas.height - cube.size));
}

function handleTouchEnd() {
    cube.isMoving = false;
}

// Головний цикл
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = cube.color;
    ctx.fillRect(cube.x, cube.y, cube.size, cube.size);
    
    requestAnimationFrame(draw);
}

draw();
