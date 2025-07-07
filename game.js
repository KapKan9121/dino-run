const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Налаштування canvas
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
    isDragging: false
};

// Слухачі подій
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    // Перевірка, чи торкнулися куба
    if (
        touch.clientX >= cube.x &&
        touch.clientX <= cube.x + cube.size &&
        touch.clientY >= cube.y &&
        touch.clientY <= cube.y + cube.size
    ) {
        cube.isDragging = true;
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (!cube.isDragging) return;
    
    const touch = e.touches[0];
    // Оновлюємо позицію куба (центруємо під палець)
    cube.x = touch.clientX - cube.size / 2;
    cube.y = touch.clientY - cube.size / 2;
}

function handleTouchEnd() {
    cube.isDragging = false;
}

// Відмальовка
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = cube.color;
    ctx.fillRect(cube.x, cube.y, cube.size, cube.size);
    
    requestAnimationFrame(draw);
}

draw();
