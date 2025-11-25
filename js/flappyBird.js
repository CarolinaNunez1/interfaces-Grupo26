// --- MENU LATERAL ---
const menuButton = document.querySelector(".menu-button");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".overlay");

if (menuButton && sidebar && overlay) {
  menuButton.addEventListener("click", () => {
    menuButton.classList.toggle("open");
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  });

  overlay.addEventListener("click", () => {
    menuButton.classList.remove("open");
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  });
}

// --- COMENTARIOS ---
const commentInput = document.querySelector(".comment-input");
const commentsContainer = document.querySelector(".comments");

if (commentInput && commentsContainer) {
  commentInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.target.value.trim() !== "") {
      const commentBox = document.createElement("div");
      commentBox.classList.add("comment");
      commentBox.innerHTML = `<strong>Tú:</strong> ${e.target.value}`;
      commentsContainer.insertBefore(commentBox, commentInput);
      e.target.value = "";
    }
  });
}
// Simular comentario
document.querySelector(".comment-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const commentBox = document.createElement("div");
    commentBox.classList.add("comment");
    commentBox.innerHTML = `<strong>Tú:</strong> ${e.target.value}`;
    document.querySelector(".comments").insertBefore(commentBox, e.target);
    e.target.value = "";
  }
});

// JUEGO
const bird = document.getElementById("bird");
const game = document.getElementById("game");
const world = document.getElementById("world");
const scoreDisplay = document.getElementById("score");
const gameOverScreen = document.getElementById("gameOver");

let birdY = 200;
let velocity = 0;
let gravity = 0.35; // gravedad más suave
let lift = -8;      // fuerza de salto controlada
let score = 0;
let pipes = [];


// SALTO
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    velocity += lift;
  }
});

document.addEventListener("click", () => {
  velocity += lift;
});


// LOOP PRINCIPAL
function gameLoop() {
    velocity += gravity;
    birdY += velocity;
  bird.style.top = birdY + "px";

  // evitar movimientos bruscos
    if (velocity > 8) velocity = 8;
    if (velocity < -8) velocity = -8;

  // Colisión suelo
  if (birdY > 460 || birdY < 0) endGame();

  movePipes();
  detectCollisions();

  requestAnimationFrame(gameLoop);
}

// CREAR TUBOS
function createPipes() {
  let gap = 150;
  let topHeight = Math.random() * 200 + 50;
  let bottomHeight = 500 - (topHeight + gap);

  let topPipe = document.createElement("div");
  let bottomPipe = document.createElement("div");

  topPipe.className = "pipe";
  bottomPipe.className = "pipe";

  topPipe.style.height = topHeight + "px";
  bottomPipe.style.height = bottomHeight + "px";

  topPipe.style.top = "0px";
  bottomPipe.style.top = topHeight + gap + "px";

  topPipe.style.left = "800px";
  bottomPipe.style.left = "800px";

  world.appendChild(topPipe);
  world.appendChild(bottomPipe);

  pipes.push({ top: topPipe, bottom: bottomPipe, x: 800 });
}

function movePipes() {
  pipes.forEach(pipe => {
    pipe.x -= 3;
    pipe.top.style.left = pipe.x + "px";
    pipe.bottom.style.left = pipe.x + "px";

    if (pipe.x === 120) {
      score++;
      scoreDisplay.innerText = score;
    }
  });
}

// COLISIONES
function detectCollisions() {
  pipes.forEach(pipe => {
    const birdRect = bird.getBoundingClientRect();
    const topRect = pipe.top.getBoundingClientRect();
    const bottomRect = pipe.bottom.getBoundingClientRect();

    if (
      birdRect.right > topRect.left &&
      birdRect.left < topRect.right &&
      (birdRect.top < topRect.bottom || birdRect.bottom > bottomRect.top)
    ) {
      endGame();
    }
  });
}

// FIN DEL JUEGO
function endGame() {
  gameOverScreen.style.display = "flex";
}

// GENERAR TUBOS AUTOMÁTICAMENTE
setInterval(createPipes, 1800);

// INICIAR
gameLoop();
// ...existing code...
(() => {
  const runner = document.getElementById('runner');
  const bird = document.getElementById('bird');
  const pipesCont = document.getElementById('pipes');
  const timerEl = document.getElementById('timer');
  const scoreEl = document.getElementById('score');
  const gameOverEl = document.getElementById('gameOver');
  const overTitle = document.getElementById('overTitle');
  const overMsg = document.getElementById('overMsg');
  const restartBtn = document.getElementById('restart');
  const resetBtn = document.getElementById('reset-btn');

  const RUNNER_W = runner.clientWidth;
  const RUNNER_H = runner.clientHeight;

  let started = false;
  let playing = true;
  let y = 200;
  let vy = 0;
  const GRAV = 0.6;
  const FLAP_V = -10;
  const PIPE_GAP = 150;
  const PIPE_W = 80;
  const PIPE_SPEED = 2.3;
  const SPAWN_INTERVAL = 1600;

  let pipes = [];
  let spawnTimer = null;
  let rafId = null;
  let lastTime = null;
  let startTime = null;
  let elapsed = 0;
  let score = 0;

  function reset() {
    // limpiar
    pipesCont.innerHTML = '';
    pipes = [];
    started = false;
    playing = true;
    y = 200;
    vy = 0;
    bird.style.top = y + 'px';
    bird.classList.remove('crash', 'flap');
    gameOverEl.classList.remove('show');
    score = 0;
    scoreEl.textContent = 'Puntos: 0';
    timerEl.textContent = '00:00';
    if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    lastTime = null;
    startTime = null;
  }

  function startGame() {
    if (started) return;
    started = true;
    startTime = performance.now();
    lastTime = performance.now();
    spawnTimer = setInterval(spawnPipe, SPAWN_INTERVAL);
    rafId = requestAnimationFrame(loop);
  }

  function spawnPipe() {
    const gapSize = PIPE_GAP;
    const minTop = 40;
    const maxTop = RUNNER_H - gapSize - 60;
    const holeY = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

    // crear contenedor pipe (top y bottom)
    const top = document.createElement('div');
    const bottom = document.createElement('div');
    top.className = 'pipe top';
    bottom.className = 'pipe bottom';

    top.style.height = holeY + 'px';
    top.style.right = '-10px';
    top.style.top = '0px';
    top.dataset.x = RUNNER_W;
    top.style.left = RUNNER_W + 'px';

    bottom.style.height = (RUNNER_H - holeY - gapSize) + 'px';
    bottom.style.left = RUNNER_W + 'px';
    bottom.dataset.x = RUNNER_W;

    pipesCont.appendChild(top);
    pipesCont.appendChild(bottom);

    pipes.push({el: top, x: RUNNER_W, w: PIPE_W});
    pipes.push({el: bottom, x: RUNNER_W, w: PIPE_W});
  }

  function flap() {
    vy = FLAP_V;
    bird.classList.add('flap');
    setTimeout(()=> bird.classList.remove('flap'), 120);
  }

  function rect(el) {
    return el.getBoundingClientRect();
  }

  function checkCollision() {
    const b = rect(bird);
    for (let p of pipes) {
      const r = rect(p.el);
      // simple AABB
      if (!(b.right < r.left || b.left > r.right || b.bottom < r.top || b.top > r.bottom)) {
        return true;
      }
    }
    // suelo / techo
    const runnerRect = rect(runner);
    if (b.top < runnerRect.top || b.bottom > runnerRect.bottom) return true;
    return false;
  }

  function gameOver(win) {
    playing = false;
    bird.classList.remove('flap');
    bird.classList.add('crash');
    if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    gameOverEl.classList.add('show');
    if (win) {
      overTitle.textContent = '¡WIN!';
      overMsg.textContent = '¡Lograste aguantar 5 minutos sin chocar!';
    } else {
      overTitle.textContent = 'Game Over';
      overMsg.textContent = 'Chocaste. Inténtalo de nuevo.';
    }
  }

  function updateTimer(now) {
    elapsed = now - startTime;
    const totalSec = Math.floor(elapsed/1000);
    const mm = String(Math.floor(totalSec/60)).padStart(2,'0');
    const ss = String(totalSec%60).padStart(2,'0');
    timerEl.textContent = `${mm}:${ss}`;

    // check win (5 minutos = 300 s)
    if (elapsed >= 300000 && playing) {
      score = Math.max(score, 1);
      scoreEl.textContent = `Puntos: ${score}`;
      gameOver(true);
    }
  }

  function loop(now) {
    if (!lastTime) lastTime = now;
    const dt = now - lastTime;
    lastTime = now;

    // física del pájaro
    if (started && playing) {
      vy += GRAV;
      y += vy;
      bird.style.top = y + 'px';

      // mover pipes
      for (let i = pipes.length-1; i >= 0; i--) {
        const p = pipes[i];
        p.x -= PIPE_SPEED;
        p.el.style.left = p.x + 'px';
        p.el.dataset.x = p.x;
        // si fuera completamente fuera del canvas lo eliminamos
        if (p.x + p.w < -50) {
          p.el.remove();
          pipes.splice(i,1);
          // sumar puntos al pasar pares (cada par representa 1)
          // evitar dar puntos por cada pieza; contar cuando se elimina pair
          // simple: aumentar score por cada 2 eliminados
        }
      }

      // puntuación simple: cuantos segundos sobrevividos
      const newScore = Math.floor((now - startTime)/1000);
      if (newScore !== score) {
        score = newScore;
        scoreEl.textContent = `Puntos: ${score}`;
      }

      // actualiza timer y win
      updateTimer(now);

      // colisiones
      if (checkCollision()) {
        gameOver(false);
        return;
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  // eventos: toque/click para flap y para iniciar
  function pointerHandler(e) {
    if (!playing) return;
    if (!started) startGame();
    flap();
  }

  // reiniciar
  restartBtn.addEventListener('click', reset);
  resetBtn.addEventListener('click', reset);
  document.addEventListener('visibilitychange', () => {
    // pausa básica si salta de pestaña
    if (document.hidden && spawnTimer) clearInterval(spawnTimer);
    if (!document.hidden && started && !spawnTimer) spawnTimer = setInterval(spawnPipe, SPAWN_INTERVAL);
  });

  // pointer (soporta mouse/touch)
  runner.addEventListener('pointerdown', pointerHandler);
  runner.addEventListener('pointerup', (e)=>{ /* por si se quiere usar */ });

  // restart en overlay
  restartBtn.addEventListener('click', () => {
    reset();
  });

  // init
  reset();

})();
