// --- MENU LATERAL ---
const menuButton = document.querySelector(".menu-button");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".overlay");
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

// El tamaño del corredor se obtiene al inicio
let RUNNER_W = runner.clientWidth;//ancho del tablero(eje:600px)
let RUNNER_H = runner.clientHeight;// Alto del tablero (ej: 600px)

let started = false;//si comienza el juego
let playing = true;//si el juego esta en curso
let y = 200; // Posición vertical inicial
let vy = 0; // Velocidad vertical
const GRAV = 0.6; // Gravedad que cae el pajaro
const FLAP_V = -10; // Impulso al aletear (valor negativo para subir)
const PIPE_GAP = 150; // Espacio entre tubería superior e inferior
const PIPE_W = 80; // Ancho de la tubería
const PIPE_SPEED = 3.5; // Velocidad de desplazamiento de las tuberías (ajustado de 2.3 a 3.5 para un juego más rápido)
const SPAWN_INTERVAL = 1800; // Intervalo de generación de tuberías en ms (antes 1600)

let pipes = []; // Array para almacenar las tuberías
let spawnTimer = null;
let rafId = null;
let lastTime = null;
let startTime = null;
let elapsed = 0;
let score = 0; // Puntuación en segundos

// Manejo del menú lateral
if (menuButton && sidebar && overlay) {
  menuButton.addEventListener("click", () => {
    // menuButton.classList.toggle("open"); // No existe "open" en CSS
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  });

  overlay.addEventListener("click", () => {
    // menuButton.classList.remove("open"); // No existe "open" en CSS
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  });
}

// --- COMENTARIOS ---
const commentInput = document.getElementById("comment-input");
const commentsContainer = document.querySelector(".comments");

if (commentInput && commentsContainer) {
  commentInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && e.target.value.trim() !== "") {
      const newComment = document.createElement("div");
      newComment.classList.add("comentario");
      
      // Estructura del nuevo comentario (simulando tu HTML)
      newComment.innerHTML = `
        <img src="../img/princesa123.png" alt="avatar">
        <div class="comentario-info">
            <p class="nombre"><strong>princesa123</strong> (tú)</p>
            <p class="mensaje">${e.target.value}</p>
        </div>
      `;
      
      // Insertar el nuevo comentario al principio de la lista de comentarios
      commentsContainer.prepend(newComment);
      e.target.value = "";
    }
  });
}

// --- LÓGICA DEL JUEGO FLAPPY BIRD ---

function reset() {
  // Recalcular tamaño del runner por si se redimensionó la ventana
  RUNNER_W = runner.clientWidth;
  RUNNER_H = runner.clientHeight;

  // Limpiar juego
  pipesCont.innerHTML = '';
  pipes = [];//vaciar array de tuberias
  //resetea el estado del juego

  started = false;
  playing = true;
  y = 200;//pajaro en el centro
  vy = 0;//sin velocidad
  bird.style.top = y + 'px';//posiciona el pajaro
  bird.classList.remove('crash', 'flap');//quita animaciones para el principio
  gameOverEl.classList.remove('show');//esconde el overlay
  score = 0;
  scoreEl.textContent = 'Puntos: 0';
  timerEl.textContent = '00:00';
  //detiene animaciones
  if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  lastTime = null;
  startTime = null;
}

function startGame() {
  if (started) return;//evita ejercutarse 2 veces
  started = true;//marca que comenzo
  startTime = performance.now();//tiempo inicial
  lastTime = performance.now();//tiempo del ultimo frame

  // Inicia la generación de tuberías
  spawnTimer = setInterval(spawnPipe, SPAWN_INTERVAL);
  // Genera la primera tubería inmediatamente
  rafId = requestAnimationFrame(loop);
}
//crea tubos
function spawnPipe() {
  // Ajuste para asegurar que el runner tenga el tamaño correcto antes de generar
  RUNNER_H = runner.clientHeight;
  RUNNER_W = runner.clientWidth;
  
  const gapSize = PIPE_GAP;
  const minTop = 60; // Mínimo espacio superior para el hueco
  const maxTop = RUNNER_H - gapSize - 60; // Máximo espacio superior
  
  if (maxTop <= minTop) {
      // Si no hay suficiente espacio para el gap, abortar (ej. ventana muy pequeña)
      return;
  }
  //egenera un numero aleatorio para la posicion del hueco
  const holeY = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;

  // Crear contenedor pipe (top y bottom)
  const top = document.createElement('div');
  const bottom = document.createElement('div');
  top.className = 'pipe top';
  bottom.className = 'pipe bottom';

  // Tubería superior
  top.style.height = holeY + 'px';
  top.style.left = RUNNER_W + 'px';
  top.style.top = '0px';
  // Tubería inferior
  bottom.style.height = (RUNNER_H - holeY - gapSize) + 'px';
  bottom.style.left = RUNNER_W + 'px';
  bottom.style.bottom = '0px'; // Asegura que esté en el fondo

  pipesCont.appendChild(top);
  pipesCont.appendChild(bottom);

  // Almacenar el par de tuberías y su posición para la detección de colisiones y movimiento
  pipes.push({el: top, x: RUNNER_W, w: PIPE_W, scored: false});
  pipes.push({el: bottom, x: RUNNER_W, w: PIPE_W, scored: false});
}

//movimientos del pajaro
function flap() {
  vy = FLAP_V;
  bird.classList.add('flap');
  // Remover la clase de aleteo para permitir que se repita la animación
  setTimeout(()=> bird.classList.remove('flap'), 120);
}

// Obtener límites del elemento
function getRect(el) {
  return el.getBoundingClientRect();
}

//detecta si chocaste
function checkCollision() {
  const runnerRect = getRect(runner);
  const b = getRect(bird);

  // Colisión con el suelo (fondo del runner)
  // Usar el límite inferior del runner como suelo
  const birdBottom = b.top + b.height - runnerRect.top;
  if (birdBottom >= RUNNER_H || b.top < runnerRect.top) { 
      return true; //choco
  }

  // Colisión con tuberías
  for (let p of pipes) {
      // Solo necesitamos revisar la colisión contra los elementos de las tuberías
      const r = getRect(p.el);
      
      
      // Si NO está en ningún lado = está dentro = COLISIÓN
      if (!(b.right < r.left || b.left > r.right || b.bottom < r.top || b.top > r.bottom)) {
          return true; // Colisión detectada
      }
  }
  return false;
}

function gameOver(win) {
  if (!playing) return;
  
  playing = false;
  bird.classList.remove('flap');
  bird.classList.add('crash');
  
  if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  
  gameOverEl.classList.add('show');
  
  if (win) {
      overTitle.textContent = '¡GANASTE!';
      overMsg.textContent = `¡Lograste sobrevivir ${score} obstaculos! ¡Felicitaciones!`;
  } else {
      overTitle.textContent = 'Game Over';
      overMsg.textContent = `Puntuación final: ${score} puntos. ¡Inténtalo de nuevo!`;
  }
}

//actualiza el timer
function updateTimer(now) {
  elapsed = now - startTime;
  const totalSec = Math.floor(elapsed/1000);
  const mm = String(Math.floor(totalSec/60)).padStart(2,'0');
  const ss = String(totalSec%60).padStart(2,'0');
  timerEl.textContent = `${mm}:${ss}`;
}

function loop(now) {
  if (!lastTime) lastTime = now;
  // const dt = now - lastTime; // dt no es necesario ya que la velocidad es constante (PIPE_SPEED)
  lastTime = now;

  if (started && playing) {
    // 1. Física del pájaro
    vy += GRAV;//aumenta velocidad por gravedad
    y += vy;//suma velocidad a la posicion
    // Asegurar que el pájaro no salga por el techo (aunque la colisión lo maneja)
    y = Math.max(y, 0); 
    bird.style.top = y + 'px';//actualiza la psoicion del pajaro

    // 2. Mover pipes
    for (let i = pipes.length-1; i >= 0; i--) {
      const p = pipes[i];
      // Mover a la izquierda
      p.x -= PIPE_SPEED;
      p.el.style.left = p.x + 'px';
      
      // 3. Chequear puntuación
      // Solo chequear el primer elemento del par (el que no fue puntuado)
      if (!p.scored && p.el.classList.contains('top') && p.x + PIPE_W < 120) { // 120px es la posición horizontal del pájaro
          p.scored = true;
          // Buscar el pipe inferior del mismo par y marcarlo también
          if (i + 1 < pipes.length && pipes[i+1].el.classList.contains('bottom')) {
              pipes[i+1].scored = true;
          } else if (i - 1 >= 0 && pipes[i-1].el.classList.contains('bottom')) {
              pipes[i-1].scored = true;
          }
          
          score++;
          scoreEl.textContent = `Puntos: ${score}`;
      }
      
      // Si está completamente fuera del canvas lo eliminamos
      if (p.x + p.w < -50) {
        p.el.remove();
        pipes.splice(i,1);
      }
    }

    // 4. Actualiza timer
    updateTimer(now);

    // 5. Colisiones
    if (checkCollision()) {
      gameOver(false);
      return;
    }
  }

  rafId = requestAnimationFrame(loop);
}

// Eventos: toque/click/espacio para flap y para iniciar
function pointerHandler(e) {
  // Evitar que el menú cierre el overlay active cuando se hace click en el juego
  if (e.target.closest('.sidebar.active') || e.target.closest('.overlay.active')) return; 
  
  if (!playing) return;
  if (!started) startGame();
  flap();
}

function keyHandler(e) {
  if (e.code === 'Space') {
      e.preventDefault(); // Evitar scroll de página al presionar espacio
      if (!playing) return;
      if (!started) startGame();
      flap();
  }
}

// Event Listeners
restartBtn.addEventListener('click', reset);
resetBtn.addEventListener('click', reset);

// Pointer (soporta mouse/touch) - Inicia el juego y aletea
runner.addEventListener('pointerdown', pointerHandler);

// Teclado (para tecla ESPACIO)
document.addEventListener('keydown', keyHandler);

// Init
reset();