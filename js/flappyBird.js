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
// Módulo FlappyEagle para encapsular la lógica del juego y evitar la contaminación del scope global.
// Se puede inicializar en cualquier contenedor con FlappyEagle.init(containerElement).

window.FlappyEagle = (() => {
    // Estado interno del módulo, no accesible desde fuera.
    let state = {
        container: null,
        bird: null,
        scoreDisplay: null,
        timerDisplay: null,
        gameOverScreen: null,
        instructions: null,
        resetButton: null,

        birdY: 250,
        birdVelocity: 0,
        gravity: 0.5,
        jumpPower: -10,
        score: 0,
        timeLeft: 60,
        gameRunning: false,
        gameStarted: false,
        lastTime: 0, // Nuevo: Almacena el timestamp del fotograma anterior

        pipes: [],
        bonuses: [],
        bombs: [],
        pipeSpeed: 0, // Lo calcularemos dinámicamente

        pipeInterval: null,
        bonusInterval: null,
        bombInterval: null,
        timerInterval: null,

        containerHeight: 0,
        containerWidth: 0,
    };

    // --- MANEJO DE EVENTOS ---
    // Funciones nombradas para poder añadirlas y quitarlas en destroy().
    const handleKeyDown = (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (!state.gameStarted) {
                state.instructions.style.display = 'none';
                startGame();
                state.gameStarted = true;
            }
            if (state.gameRunning) {
                jump();
            }
        }
    };

    const handleResize = () => {
        if (!state.container) return;
        const rect = state.container.getBoundingClientRect();
        state.containerWidth = rect.width;
        state.containerHeight = rect.height;
        if (!state.gameStarted) {
            state.birdY = state.containerHeight / 2;
            state.bird.style.top = state.birdY + 'px';
        }
    };

    // --- LÓGICA DEL JUEGO ---
    function startGame() {
        state.gameRunning = true;
        state.score = 0;
        state.timeLeft = 60;
        state.birdY = state.containerHeight / 2;
        state.birdVelocity = 0;
        state.pipes = [];
        state.bonuses = [];
        state.bombs = [];

        updateScore();
        updateTimer();

        // Limpiar elementos de partidas anteriores
        state.container.querySelectorAll('.fe-pipe, .fe-bonus, .fe-particle, .fe-bomb').forEach(el => el.remove());

        // Reiniciar estado visual del pájaro
        state.bird.classList.remove('fe-exploding');
        state.bird.style.transform = 'translateX(-50%) rotate(0deg)';
        state.gameOverScreen.style.display = 'none';

        // Iniciar intervalos del juego
        state.lastTime = performance.now(); // Para la física del pájaro
        requestAnimationFrame(gameLoop); // Para la física del pájaro y colisiones
        state.pipeInterval = setInterval(createPipe, 2000);
        state.bonusInterval = setInterval(createBonus, 3000);
        state.bombInterval = setInterval(createBomb, 4000);
        state.timerInterval = setInterval(updateTime, 1000);

        // Iniciar las animaciones CSS
        state.container.querySelectorAll('.fe-pipe').forEach(pipe => {
            pipe.style.animationPlayState = 'running';
        });
    }

    function jump() {
        state.birdVelocity = state.jumpPower;
    }

    function gameLoop(timestamp) {
        if (!state.gameRunning) {
            // Si el juego terminó, NO pedir el siguiente frame
            return;
        }

        // 1. Cálculo de Delta Time (tiempo transcurrido desde el último frame)
        const deltaTime = timestamp - state.lastTime;
        state.lastTime = timestamp;

        // 3. Física del pájaro (ajustar por deltaTime)
        // La gravedad y el salto deben escalarse por deltaTime para consistencia.
        // Asume que 20ms era el tiempo objetivo original (1.0 = deltaTime / 20)
        const timeScale = deltaTime / 20;

        state.birdVelocity += state.gravity * timeScale; // Aplicar gravedad escalada
        state.birdY += state.birdVelocity * timeScale; // Aplicar velocidad escalada
        state.bird.style.top = state.birdY + 'px';

        // Rotación del pájaro
        let rotation = Math.min(Math.max(state.birdVelocity * 3, -30), 90);
        state.bird.style.transform = `translateX(-50%) rotate(${rotation}deg)`;

        // Límites de pantalla
        if (state.birdY < 0) {
            state.birdY = 0;
            state.birdVelocity = 0;
        }
        // --- Detectar suelo real basado en la altura del piso (100px) ---
        const GROUND_HEIGHT = 100;

        if (state.birdY + state.bird.offsetHeight >= state.containerHeight ) {
            explodeBird();
            endGame('¡Tocaste el suelo!');
        }

        // Chequear colisiones con tuberías
        checkPipeCollisions();

        // Mover bonus y chequear colisiones
        moveElements(state.bonuses, (bonus) => {
            if (checkCollision(state.bird, bonus.element)) {
                collectBonus(bonus.element);
                bonus.element.remove();
                return true; // Indica que fue removido
            }
            return false;
        });

        // Mover bombas y chequear colisiones
        moveElements(state.bombs, (bomb) => {
            if (checkCollision(state.bird, bomb.element)) {
                explodeBird();
                bomb.element.remove();
                setTimeout(() => {
                    endGame('¡Chocaste con una bomba!');
                }, 650);
                return true; // Indica que fue removido
            }
            return false;
        });

        // 4. Llamar al siguiente frame
        requestAnimationFrame(gameLoop);
    }

    function checkPipeCollisions() {
        for (let i = state.pipes.length - 1; i >= 0; i--) {
            const pipe = state.pipes[i];
            // Verificar colisión
            if (checkCollision(state.bird, pipe.element)) {
                explodeBird();
                setTimeout(() => {
                    endGame('¡Chocaste con una caja!');
                }, 650);
            }
        }
    }

    function moveElements(elements, onCollision, onRemove) {
        for (let i = elements.length - 1; i >= 0; i--) {
            const item = elements[i];
            let itemLeft = parseFloat(item.element.style.left);
            // Calcular velocidad para bonus basada en la velocidad de la capa 4
            const BG_DURATION = 10000;
            const bonusSpeed = state.containerWidth / BG_DURATION * 20; // aproximado para 50fps
            itemLeft -= bonusSpeed;
            item.element.style.left = itemLeft + 'px';

            if (itemLeft < -100) {
                if (onRemove) onRemove(item);
                item.element.remove();
                elements.splice(i, 1);
            } else {
                if (onCollision(item)) {
                    elements.splice(i, 1);
                }
            }
        }
    }

    function handlePipeEnd(e) {
        const pipeElement = e.target;
        // Remover del DOM y del array state.pipes
        pipeElement.remove();
        state.pipes = state.pipes.filter(p => p.element !== pipeElement);
    }

    function createPipe() {
        if (!state.gameRunning) return;

        const GROUND_HEIGHT = 0;
        const PIPE_WIDTH = 80;
        // AUMENTAR la velocidad a 200 px/s para que sean visiblemente más rápidas que el fondo de 4s
        const TARGET_SPEED_PX_PER_SEC = 225; // 200 px/s

        let gap = 200;
        let minHeight = 50;
        let maxHeight = state.containerHeight - GROUND_HEIGHT - gap - 50;
        let topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

        // 1. CÁLCULO DE DISTANCIA Y DURACIÓN
        // Distancia: Ancho del contenedor + Ancho de la tubería para que salga completamente
        const moveDistance = state.containerWidth + PIPE_WIDTH;

        // **CÁLCULO DE DURACIÓN:**
        // Duración = Distancia Total (px) / Velocidad (px/s)
        const animationDuration = moveDistance / TARGET_SPEED_PX_PER_SEC; // Resultado en segundos

        // Función auxiliar para crear y configurar el elemento
        const createPipeElement = (topOrBottom, height = 0) => {
            const el = document.createElement('div');
            el.className = `fe-pipe fe-pipe-${topOrBottom}`;

            // 2. APLICAR ESTILOS DE ANIMACIÓN DINÁMICOS
            el.style.left = state.containerWidth + 'px'; // Posición inicial (borde derecho)
            el.style.height = height + 'px';
            el.style.setProperty('--pipe-move-distance', `-${moveDistance}px`); // Distancia final
            el.style.animationDuration = `${animationDuration}s`;
            el.style.animationPlayState = state.gameRunning ? 'running' : 'paused';

            // 3. LISTENER PARA ELIMINACIÓN Y PUNTUACIÓN
            el.addEventListener('animationend', handlePipeEnd, { once: true });
            return el;
        };

        // --- Tubería superior ---
        let pipeTop = createPipeElement('top', topHeight);
        state.container.appendChild(pipeTop);

        // --- Tubería inferior ---
        let pipeBottom = createPipeElement('bottom', (state.containerHeight - GROUND_HEIGHT - topHeight - gap));
        pipeBottom.style.bottom = GROUND_HEIGHT + 'px';
        state.container.appendChild(pipeBottom);

        state.pipes.push({ element: pipeTop });
        state.pipes.push({ element: pipeBottom });
    }


    function createBonus() {
        if (!state.gameRunning) return;

        let bonusElement = document.createElement('div');
        bonusElement.className = 'fe-bonus';
        bonusElement.style.left = state.containerWidth + 'px';
        bonusElement.style.top = (Math.random() * (state.containerHeight - 250) + 50) + 'px';
        state.container.appendChild(bonusElement);

        state.bonuses.push({ element: bonusElement });
    }

    function createBomb() {
        if (!state.gameRunning) return;

        let bombElement = document.createElement('div');
        bombElement.className = 'fe-bomb';
        bombElement.style.left = state.containerWidth + 'px';
        bombElement.style.top = (Math.random() * (state.containerHeight - 250) + 50) + 'px';
        state.container.appendChild(bombElement);

        state.bombs.push({ element: bombElement });
    }


    function collectBonus(bonusElement) {
        state.score += 50;
        updateScore();
        let rect = bonusElement.getBoundingClientRect();
        let containerRect = state.container.getBoundingClientRect();

        for (let i = 0; i < 8; i++) {
            let particle = document.createElement('div');
            particle.className = 'fe-particle';
            // Posicionar relativo al contenedor del juego
            particle.style.left = (rect.left - containerRect.left + 20) + 'px';
            particle.style.top = (rect.top - containerRect.top + 20) + 'px';
            let angle = (Math.PI * 2 * i) / 8;
            let distance = 50;
            particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
            particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
            state.container.appendChild(particle);
            setTimeout(() => particle.remove(), 500);
        }
    }

    function explodeBird() {
        state.gameRunning = false;

        state.bird.style.animation = 'none';
        state.bird.style.removeProperty('animation');
        state.bird.style.transform = 'translateX(-50%)';

        void state.bird.offsetWidth;

        state.bird.style.width = '64px';
        state.bird.style.height = '65.6px';

        state.bird.style.backgroundImage = "url('../assets/enemy-deadth.png')";
        state.bird.style.backgroundSize = '384px 65.6px';

        // Activamos la explosión
        state.bird.style.animation = 'fe-bird-explode 0.6s steps(6) forwards';

        // Cuando la animación termine → hacer invisible el pájaro
        state.bird.addEventListener('animationend', handleExplosionEnd, { once: true });
    }

    function handleExplosionEnd() {
        state.bird.style.opacity = '0';
    }




    // Constante para reducir la hitbox (en píxeles)
    const COLLISION_PADDING = 10; // Ajustado para mejor precisión de colisión

    function checkCollision(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        let rect2 = element2.getBoundingClientRect();

        // Aplicar padding si element2 es un obstáculo (tubería o bonus)
        // Usamos hasOwnProperty para verificar si el elemento tiene la clase fe-pipe
        if (element2.classList.contains('fe-pipe') || element2.classList.contains('fe-bonus') || element2.classList.contains('fe-bomb')) {
            // Creamos una copia de las dimensiones de la tubería (rect2) y ajustamos
            rect2 = {
                left: rect2.left + COLLISION_PADDING,
                right: rect2.right - COLLISION_PADDING,
                top: rect2.top + COLLISION_PADDING,
                bottom: rect2.bottom - COLLISION_PADDING,
                width: rect2.width - (2 * COLLISION_PADDING),
                height: rect2.height - (2 * COLLISION_PADDING)
            };
        }

        // Lógica de colisión con las dimensiones ajustadas
        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
        );
    }

    function updateScore() {
        state.scoreDisplay.textContent = 'Puntos: ' + state.score;
    }

    function updateTime() {
        if (!state.gameRunning) return;
        state.timeLeft--;
        updateTimer();
        if (state.timeLeft <= 0) {
            state.gameRunning = false;
            endGame('¡Ganaste! Completaste el tiempo', true);
        }
    }

    function updateTimer() {
        state.timerDisplay.textContent = 'Tiempo: ' + state.timeLeft + 's';
    }

    function endGame(message, won = false) {
        // Esta función ahora se llama después de la animación de explosión
        clearInterval(state.pipeInterval);
        clearInterval(state.bonusInterval);
        clearInterval(state.bombInterval);
        clearInterval(state.timerInterval);

        // Pausar las animaciones CSS
        state.container.querySelectorAll('.fe-pipe').forEach(pipe => {
            pipe.style.animationPlayState = 'paused';
        });

        state.gameOverScreen.querySelector('#fe-final-score').textContent = 'Puntuación Final: ' + state.score;
        state.gameOverScreen.querySelector('#fe-final-time').textContent = message;
        state.gameOverScreen.style.display = 'block';

        const title = state.gameOverScreen.querySelector('h1');
        if (won) {
            title.textContent = 'Ganaste';
            title.style.color = '#4CAF50';
        } else {
            title.textContent = 'Perdiste';
            title.style.color = '#f44336';
        }
    }

    function resetGame() {
        state.gameStarted = false;
        state.instructions.style.display = 'block';
        state.gameOverScreen.style.display = 'none';

        // --- RESTAURAR SPRITE ORIGINAL DEL PÁJARO ---
        state.bird.style.backgroundImage = "url('../assets/eagle-attack.png')";
        state.bird.style.backgroundSize = "256px 65.6px"; // tamaño original de 4 frames
        state.bird.style.width = "64px";
        state.bird.style.height = "65.6px";

        // Restaurar animación normal del pájaro
        state.bird.style.animation = "fe-bird-flap 0.4s steps(4) infinite";

        // Restaurar rotación
        state.bird.style.transform = 'translateX(-50%) rotate(0deg)';

        // Quitar cualquier rastro de explosión
        state.bird.classList.remove('fe-exploding');

        state.bird.style.opacity = '1'; // volver a verlo

        // Limpiar elementos del juego
        state.container.querySelectorAll('.fe-pipe, .fe-bonus, .fe-particle, .fe-bomb').forEach(el => el.remove());

        // Resetear variables principales
        state.score = 0;
        state.timeLeft = 60;
        state.birdY = state.containerHeight / 2;
        state.birdVelocity = 0;
        updateScore();
        updateTimer();
        state.bird.style.top = state.birdY + 'px';
    }



    function init(containerElement) {
        if (!containerElement) {
            console.error("FlappyEagle: El contenedor no fue encontrado.");
            return false;
        }
        state.container = containerElement;

        // Cachear elementos del DOM con los nuevos IDs prefijados
        state.bird = state.container.querySelector('#fe-bird');
        state.scoreDisplay = state.container.querySelector('#fe-score');
        state.timerDisplay = state.container.querySelector('#fe-timer');
        state.gameOverScreen = state.container.querySelector('#fe-game-over');
        state.instructions = state.container.querySelector('#fe-instructions');
        state.resetButton = state.container.querySelector('#fe-reset-button');

        if (!state.bird || !state.resetButton) {
            console.error("FlappyEagle: Elementos del juego no encontrados dentro del contenedor.");
            return false;
        }

        // Configurar tamaño responsive inicial
        handleResize();

        // Añadir listeners
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', handleResize);
        state.resetButton.addEventListener('click', resetGame);

        return true;
    }

    function destroy() {
        // Detener el juego y limpiar intervalos
        state.gameRunning = false;
        clearInterval(state.pipeInterval);
        clearInterval(state.bonusInterval);
        clearInterval(state.bombInterval);
        clearInterval(state.timerInterval);

        // Limpiar listeners
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', handleResize);

        // Limpiar el contenedor
        if (state.container) {
            state.container.innerHTML = '';
        }

        // Resetear el estado para una posible reinicialización
        Object.keys(state).forEach(key => state[key] = null);
    }

    return {
        init,
        destroy
    };
})();


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

