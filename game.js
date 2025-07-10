/* ------------ ініціалізація canvas ------------ */
const canvas = document.getElementById("canvas");
const ctx    = canvas.getContext("2d");
canvas.width  = innerWidth;
canvas.height = innerHeight;

/* ------------ ресурси ------------ */
const playerImg = new Image();
playerImg.src   = "images/player/player.png";

const bgImg  = new Image();
bgImg.src    = "images/fon/layer_far.png";

const enemyImg = new Image();
enemyImg.src   = "images/enemies/enemy1.png";

/* ------------ гравець ------------ */
const player = { x: canvas.width/2, y: canvas.height*0.8,
  w:60, h:60, vx:0, vy:0 };

/* ------------ масиви ------------ */
const bullets = [];
const enemies = [];

/* ------------ глобальні змінні ------------ */
let kills = 0;
let bgY = 0;
let lastShot = 0;
let lastSpawn = 0;
const SHOT_DELAY   = 200;   // мс
const SPAWN_DELAY  =  900;  // мс

/* ------------ керування дотиком ------------ */
let lastTouch = null, STOP = 0.5;

canvas.addEventListener("touchstart", e=>{
  const t=e.touches[0];
  lastTouch={x:t.clientX,y:t.clientY,time:performance.now()};
});
canvas.addEventListener("touchmove", e=>{
  if(!lastTouch) return;
  const t=e.touches[0], now=performance.now();
  const dt = now-lastTouch.time || 16;
  const vx = (t.clientX-lastTouch.x)/(dt/16.66);
  const vy = (t.clientY-lastTouch.y)/(dt/16.66);
  const sp = Math.hypot(vx,vy);
  player.vx = sp<STOP ? 0 : vx;
  player.vy = sp<STOP ? 0 : vy;
  lastTouch={x:t.clientX,y:t.clientY,time:now};
});
canvas.addEventListener("touchend", ()=>{
  player.vx=player.vy=0; lastTouch=null;
});

/* ------------ допоміжні функції ------------ */
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
function drawHP(e){
  const pct=e.hp/e.maxHp, pad=4, barW=e.w-pad*2, barH=6;
  const x=e.x+pad, y=e.y-8, radius=3;
  ctx.fillStyle="#222"; roundRect(ctx,x,y,barW,barH,radius); ctx.fill();
  ctx.fillStyle=pct>0.6?"#0f0":pct>0.3?"#ff0":"#f00";
  roundRect(ctx,x,y,barW*pct,barH,radius); ctx.fill();
}
function spawnEnemy(){
  enemies.push({
    x: Math.random()*(canvas.width-50),
    y:-60, w:50, h:50,
    vx:(Math.random()<.5?-1:1)*40, // px/с
    vy:120,                       // px/с
    hp:100, maxHp:100,
    lastHit:0
  });
}

/* ------------ основний цикл ------------ */
let prev = performance.now();
function loop(now){
  const dt = (now-prev)/1000; prev=now;   // секунди

  /* фон */
  bgY += 100*dt; if(bgY>canvas.height) bgY-=canvas.height;
  ctx.drawImage(bgImg,0,bgY,canvas.width,canvas.height);
  ctx.drawImage(bgImg,0,bgY-canvas.height,canvas.width,canvas.height);

  /* гравець */
  player.x+=player.vx; player.y+=player.vy;
  player.x=Math.max(player.w/2,Math.min(canvas.width-player.w/2,player.x));
  player.y=Math.max(player.h/2,Math.min(canvas.height-player.h/2,player.y));
  ctx.drawImage(playerImg,player.x-player.w/2,player.y-player.h/2,player.w,player.h);

  /* авто-стрільба */
  if(now-lastShot>SHOT_DELAY){
    bullets.push({x:player.x, y:player.y-player.h/2, vy:600}); // px/с
    lastShot=now;
  }

  /* кулі */
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];
    b.y -= b.vy*dt;
    ctx.fillStyle="white"; ctx.fillRect(b.x-2,b.y,4,10);
    if(b.y<-20) bullets.splice(i,1);
  }

  /* спавн ворогів */
  if(now-lastSpawn>SPAWN_DELAY){ spawnEnemy(); lastSpawn=now; }

  /* вороги + колізії */
  for(let ei=enemies.length-1; ei>=0; ei--){
    const e=enemies[ei];
    e.x += e.vx*dt;
    e.y += e.vy*dt;
    if(e.x<0||e.x+e.w>canvas.width) e.vx*=-1;

    ctx.drawImage(enemyImg,e.x,e.y,e.w,e.h);
    if(now-e.lastHit<0.5*1000) drawHP(e);

    /* кулі → ворог */
    for(let bi=bullets.length-1; bi>=0; bi--){
      const b=bullets[bi];
      if(b.x>e.x && b.x<e.x+e.w && b.y>e.y && b.y<e.y+e.h){
        bullets.splice(bi,1);
        e.hp-=25; e.lastHit=now;
        if(e.hp<=0){ enemies.splice(ei,1); kills++; break; }
      }
    }
    /* ворог → гравець */
    if(Math.hypot(player.x-(e.x+e.w/2),player.y-(e.y+e.h/2))<35){
      return location.reload(); // restart
    }
    /* ворог виходить вниз */
    if(e.y>canvas.height+e.h) enemies.splice(ei,1);
  }

  /* рахунок */
  ctx.fillStyle="white"; ctx.font="18px sans-serif";
  ctx.fillText(`Kills: ${kills}`,10,25);

  requestAnimationFrame(loop);
}

/* ------------ запуск після завантаження всіх зображень ------------ */
Promise.all([playerImg,bgImg,enemyImg].map(img=>new Promise(r=>img.onload=r)))
       .then(()=>requestAnimationFrame(loop));
