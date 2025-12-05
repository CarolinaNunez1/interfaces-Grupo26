// flappyBird.js - módulo FlappyEagle (auto-inicializa al DOMContentLoaded)

// --- MENU LATERAL (sin cambios funcionales) ---
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

// --- COMENTARIOS (uso seguro de selectores: solo si existen) ---
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
// segunda escucha guardada (evita errores si no existe)
if (document.querySelector(".comment-input") && document.querySelector(".comments")) {
  document.querySelector(".comment-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const commentBox = document.createElement("div");
      commentBox.classList.add("comment");
      commentBox.innerHTML = `<strong>Tú:</strong> ${e.target.value}`;
      document.querySelector(".comments").insertBefore(commentBox, e.target);
      e.target.value = "";
    }
  });
}

// ------------------- Módulo del juego -------------------
window.FlappyEagle = (() => {
    // Estado interno
    let state = {
        container: null,
        bird: null,
        scoreDisplay: null,
        timerDisplay: null,
        gameOverScreen: null,
        instructions: null,
        resetButton: null,
        powerupEl: null,
        objectsContainer: null,

        birdY: 250,
        birdVelocity: 0,
        gravity: 0.5,
        jumpPower: -10,
        score: 0,
        timeLeft: 60,
        gameRunning: false,
        gameStarted: false,
        lastTime: 0,

        pipes: [],
        bonuses: [],
        bombs: [],
        pipeSpeed: 0,

        pipeInterval: null,
        bonusInterval: null,
        bombInterval: null,
        timerInterval: null,

        containerHeight: 0,
        containerWidth: 0,

        // power-up (escudo)
        hasShield: false,
        shieldTimeout: null,
    };

    // --- Eventos nombrados (para removerlos en destroy) ---
    const handleKeyDown = (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            startOrJump();
        }
    };

    const handlePointerDown = (e) => {
        // prevenir interacciones con inputs u overlays
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON')) return;
        startOrJump();
    };

   function startOrJump() {
    // Inicia el juego si todavía no comenzó
    if (!state.gameStarted) {

        // Ocultar instrucciones SOLO si existieran
        const instructions = document.getElementById("fe-instructions");
        if (instructions) instructions.style.display = "none";

        startGame();
        state.gameStarted = true;
        return;
    }

    // Si el juego ya empezó → salto
    jump();
}


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

    // --- Juego ---
    function startGame() {
        state.gameRunning = true;
        state.score = 0;
        state.timeLeft = 60;
        state.birdY = state.containerHeight / 2;
        state.birdVelocity = 0;
        state.pipes = [];
        state.bonuses = [];
        state.bombs = [];
        state.hasShield = false;
        if (state.shieldTimeout) { clearTimeout(state.shieldTimeout); state.shieldTimeout = null; }

        updateScore();
        updateTimer();

        // Limpiar elementos de partidas anteriores
        state.container.querySelectorAll('.fe-pipe, .fe-bonus, .fe-particle, .fe-bomb').forEach(el => el.remove());

        // Reiniciar estado visual del pájaro
        state.bird.classList.remove('fe-exploding');
        state.bird.style.transform = 'translateX(-50%) rotate(0deg)';
        state.bird.style.opacity = '1';
        state.gameOverScreen.style.display = 'none';
        hidePowerup();

        // Iniciar loop y timers
        state.lastTime = performance.now();
        requestAnimationFrame(gameLoop);
        state.pipeInterval = setInterval(createPipe, 1800);
        state.bonusInterval = setInterval(createBonus, 3000);
        state.bombInterval = setInterval(createBomb, 4200);
        state.timerInterval = setInterval(updateTime, 1000);

        // Activar animaciones CSS de pipes ya creadas
        state.container.querySelectorAll('.fe-pipe').forEach(pipe => {
            pipe.style.animationPlayState = 'running';
        });
    }

    function jump() {
        state.birdVelocity = state.jumpPower;
    }

    function gameLoop(timestamp) {
        if (!state.gameRunning) return;

        const deltaTime = timestamp - state.lastTime;
        state.lastTime = timestamp;
        const timeScale = deltaTime / 20;

        // física pájaro
        state.birdVelocity += state.gravity * timeScale;
        state.birdY += state.birdVelocity * timeScale;
        state.bird.style.top = state.birdY + 'px';

        // rotación del pájaro
        let rotation = Math.min(Math.max(state.birdVelocity * 3, -30), 90);
        state.bird.style.transform = `translateX(-50%) rotate(${rotation}deg)`;

        // límites
        if (state.birdY < 0) {
            state.birdY = 0;
            state.birdVelocity = 0;
        }
        if (state.birdY + state.bird.offsetHeight >= state.containerHeight) {
            // Si tiene escudo, consumirlo
            if (state.hasShield) {
                consumeShield();
            } else {
                explodeBird();
                endGame('¡Tocaste el suelo!');
            }
            return;
        }

        // colisiones tuberías
        checkPipeCollisions();

        // mover y chequear bonuses + bombas
        moveElements(state.bonuses, (bonus) => {
            if (checkCollision(state.bird, bonus.element)) {
                collectBonus(bonus.element);
                bonus.element.remove();
                return true;
            }
            return false;
        }, (item) => {
            // onRemove optional
            // no-op
        });

        moveElements(state.bombs, (bomb) => {
            if (checkCollision(state.bird, bomb.element)) {
                // si tiene escudo lo consumimos en lugar de morir
                if (state.hasShield) {
                    bomb.element.remove();
                    consumeShield();
                    return true;
                } else {
                    explodeBird();
                    bomb.element.remove();
                    setTimeout(() => endGame('¡Chocaste con una bomba!'), 650);
                    return true;
                }
            }
            return false;
        });

        requestAnimationFrame(gameLoop);
    }

    function checkPipeCollisions() {
        for (let i = state.pipes.length - 1; i >= 0; i--) {
            const pipe = state.pipes[i];
            if (!pipe.element) continue;
            if (checkCollision(state.bird, pipe.element)) {
                if (state.hasShield) {
                    // consumir shield y quitar la tubería
                    pipe.element.remove();
                    state.pipes.splice(i, 1);
                    consumeShield();
                } else {
                    explodeBird();
                    setTimeout(() => endGame('¡Chocaste con una tuberia!'), 650);
                }
            }
        }
    }

    function moveElements(elements, onCollision, onRemove) {
        for (let i = elements.length - 1; i >= 0; i--) {
            const item = elements[i];
            let left = parseFloat(item.element.style.left || (state.containerWidth + 0));
            // velocidad basada en capa más cercana (approx)
            const pxPerSecond = 225; // coincide con velocidad de tuberías
            const delta = (pxPerSecond / 60); // px por frame aproximado
            left -= delta;
            item.element.style.left = left + 'px';

            if (left < -200) {
                if (onRemove) onRemove(item);
                if (item.element && item.element.parentNode) item.element.remove();
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
        if (pipeElement && pipeElement.parentNode) pipeElement.remove();
        state.pipes = state.pipes.filter(p => p.element !== pipeElement);
    }

    function createPipe() {
        if (!state.gameRunning) return;

        const PIPE_WIDTH = 80;
        const GAP = 200;
        const MIN_H = 50;
        const maxTop = Math.max(state.containerHeight - GAP - MIN_H - 50, MIN_H);
        const topHeight = Math.random() * (maxTop - MIN_H) + MIN_H;

        const moveDistance = state.containerWidth + PIPE_WIDTH;
        const TARGET_SPEED_PX_PER_SEC = 225;
        const animationDuration = moveDistance / TARGET_SPEED_PX_PER_SEC;

        const createPipeElement = (topOrBottom, height = 0) => {
            const el = document.createElement('div');
            el.className = `fe-pipe fe-pipe-${topOrBottom} ${topOrBottom === 'top' ? 'fe-pipe-top' : 'fe-pipe-bottom'}`;
            el.style.left = state.containerWidth + 'px';
            el.style.height = height + 'px';
            if (topOrBottom === 'bottom') {
                el.style.bottom = '0px';
            } else {
                el.style.top = '0px';
            }
            el.style.setProperty('--pipe-move-distance', `-${moveDistance}px`);
            el.style.animationDuration = `${animationDuration}s`;
            el.style.animationPlayState = state.gameRunning ? 'running' : 'paused';
            el.addEventListener('animationend', handlePipeEnd, { once: true });
            // añadimos a objects container si existe
            (state.objectsContainer || state.container).appendChild(el);
            return el;
        };

        const pipeTop = createPipeElement('top', topHeight);
        const pipeBottom = createPipeElement('bottom', state.containerHeight - topHeight - GAP);
        state.pipes.push({ element: pipeTop });
        state.pipes.push({ element: pipeBottom });
    }

    function createBonus() {
        if (!state.gameRunning) return;
        const bonus = document.createElement('div');
        bonus.className = 'fe-bonus';
        bonus.style.left = state.containerWidth + 'px';
        bonus.style.top = (Math.random() * (state.containerHeight - 200) + 50) + 'px';
        (state.objectsContainer || state.container).appendChild(bonus);
        state.bonuses.push({ element: bonus });
    }

    function createBomb() {
        if (!state.gameRunning) return;
        const bomb = document.createElement('div');
        bomb.className = 'fe-bomb';
        bomb.style.left = state.containerWidth + 'px';
        bomb.style.top = (Math.random() * (state.containerHeight - 200) + 50) + 'px';
        (state.objectsContainer || state.container).appendChild(bomb);
        state.bombs.push({ element: bomb });
    }

    function collectBonus(bonusElement) {
        state.score += 50;
        updateScore();

        // Partículas
        const rect = bonusElement.getBoundingClientRect();
        const containerRect = state.container.getBoundingClientRect();
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'fe-particle';
            particle.style.left = (rect.left - containerRect.left + 10) + 'px';
            particle.style.top = (rect.top - containerRect.top + 10) + 'px';
            const angle = (Math.PI * 2 * i) / 8;
            const distance = 50;
            particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
            particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
            state.container.appendChild(particle);
            setTimeout(() => particle.remove(), 500);
        }

        // Power-up: cada gema otorga un escudo temporal (5s)
        grantShield(5000);
    }

    function grantShield(duration = 5000) {
        state.hasShield = true;
        showPowerup();
        if (state.shieldTimeout) clearTimeout(state.shieldTimeout);
        state.shieldTimeout = setTimeout(() => {
            state.hasShield = false;
            hidePowerup();
            state.shieldTimeout = null;
        }, duration);
    }

    function consumeShield() {
        state.hasShield = false;
        hidePowerup();
        if (state.shieldTimeout) { clearTimeout(state.shieldTimeout); state.shieldTimeout = null; }
        // efecto visual: pequeña ráfaga
        const burst = document.createElement('div');
        burst.className = 'fe-particle';
        // colocarlo sobre el pájaro
        const birdRect = state.bird.getBoundingClientRect();
        const containerRect = state.container.getBoundingClientRect();
        burst.style.left = (birdRect.left - containerRect.left + 5) + 'px';
        burst.style.top = (birdRect.top - containerRect.top + 5) + 'px';
        state.container.appendChild(burst);
        setTimeout(() => burst.remove(), 500);
    }

    function showPowerup() {
        if (!state.powerupEl) return;
        state.powerupEl.classList.add('show');
        state.powerupEl.style.display = 'block';
    }
    function hidePowerup() {
        if (!state.powerupEl) return;
        state.powerupEl.classList.remove('show');
        state.powerupEl.style.display = 'none';
    }

    function explodeBird() {
        state.gameRunning = false;

        state.bird.style.animation = 'none';
        state.bird.style.removeProperty('animation');
        state.bird.style.transform = 'translateX(-50%)';

        void state.bird.offsetWidth;

        state.bird.style.width = '64px';
        state.bird.style.height = '65.6px';

        // usar imagen en ../img/ para coincidir con CSS
        state.bird.style.backgroundImage = "url('../img/enemy-deadth.png')";
        state.bird.style.backgroundSize = '384px 65.6px';
        state.bird.style.animation = 'fe-bird-explode 0.6s steps(6) forwards';

        state.bird.addEventListener('animationend', handleExplosionEnd, { once: true });
    }

    function handleExplosionEnd() {
        state.bird.style.opacity = '0';
    }

    const COLLISION_PADDING = 10;

    function checkCollision(element1, element2) {
        if (!element1 || !element2) return false;
        const rect1 = element1.getBoundingClientRect();
        let rect2 = element2.getBoundingClientRect();

        if (element2.classList.contains('fe-pipe') || element2.classList.contains('fe-bonus') || element2.classList.contains('fe-bomb')) {
            rect2 = {
                left: rect2.left + COLLISION_PADDING,
                right: rect2.right - COLLISION_PADDING,
                top: rect2.top + COLLISION_PADDING,
                bottom: rect2.bottom - COLLISION_PADDING,
                width: rect2.width - (2 * COLLISION_PADDING),
                height: rect2.height - (2 * COLLISION_PADDING)
            };
        }

        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
        );
    }

    function updateScore() {
        if (state.scoreDisplay) state.scoreDisplay.textContent = 'Puntos: ' + state.score;
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
        if (state.timerDisplay) state.timerDisplay.textContent = 'Tiempo: ' + state.timeLeft + 's';
    }

    function endGame(message, won = false) {
        clearInterval(state.pipeInterval);
        clearInterval(state.bonusInterval);
        clearInterval(state.bombInterval);
        clearInterval(state.timerInterval);

        state.container.querySelectorAll('.fe-pipe').forEach(pipe => {
            pipe.style.animationPlayState = 'paused';
        });

        if (state.gameOverScreen) {
            state.gameOverScreen.querySelector('#fe-final-score').textContent = 'Puntuación Final: ' + state.score;
            state.gameOverScreen.querySelector('#fe-final-time').textContent = message;
            state.gameOverScreen.style.display = 'block';
            const title = state.gameOverScreen.querySelector('h1');
            if (won) {
                title.textContent = 'Ganaste';
                title.style.color = '#ffffffff';
            } else {
                title.textContent = 'Perdiste';
                title.style.color = '#ffffffff';
            }
        }
    }

    function resetGame() {
        state.gameStarted = false;
        if (state.instructions) state.instructions.style.display = 'block';
        if (state.gameOverScreen) state.gameOverScreen.style.display = 'none';

        // restaurar sprite original (usar ../img/personaje.png)
        state.bird.style.backgroundImage = "url('../img/birds.png')";
        state.bird.style.backgroundSize = "256px 65.6px";
        state.bird.style.width = "64px";
        state.bird.style.height = "65.6px";
        state.bird.style.animation = "fe-bird-flap 0.4s steps(4) infinite";
        state.bird.style.transform = 'translateX(-50%) rotate(0deg)';
        state.bird.classList.remove('fe-exploding');
        state.bird.style.opacity = '1';

        state.container.querySelectorAll('.fe-pipe, .fe-bonus, .fe-particle, .fe-bomb').forEach(el => el.remove());

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

        // Cachear elementos del DOM
        state.bird = state.container.querySelector('#fe-bird');
        state.scoreDisplay = state.container.querySelector('#fe-score');
        state.timerDisplay = state.container.querySelector('#fe-timer');
        state.gameOverScreen = state.container.querySelector('#fe-game-over');
        state.instructions = state.container.querySelector('#fe-instructions');
        state.resetButton = state.container.querySelector('#fe-reset-button');
        state.powerupEl = state.container.querySelector('#fe-powerup');
        state.objectsContainer = state.container.querySelector('#fe-objects');

        if (!state.bird || !state.resetButton) {
            console.error("FlappyEagle: Elementos del juego no encontrados dentro del contenedor.");
            return false;
        }

        // tamaño inicial
        handleResize();

        // listeners
        window.addEventListener('keydown', handleKeyDown);
        state.container.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('resize', handleResize);
        state.resetButton.addEventListener('click', resetGame);

        return true;
    }

    function destroy() {
        state.gameRunning = false;
        clearInterval(state.pipeInterval);
        clearInterval(state.bonusInterval);
        clearInterval(state.bombInterval);
        clearInterval(state.timerInterval);

        window.removeEventListener('keydown', handleKeyDown);
        if (state.container) state.container.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('resize', handleResize);

        if (state.container) {
            // no limpiamos todo el HTML del contenedor (evita perder templates)
            state.container.querySelectorAll('.fe-pipe, .fe-bonus, .fe-particle, .fe-bomb').forEach(el => el.remove());
        }

        Object.keys(state).forEach(key => state[key] = null);
    }

    return { init, destroy };
})();

// Auto-inicializar cuando el DOM esté listo (no hay JS inline en el HTML)
document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.querySelector('.flappyeagle-embed');
    if (gameContainer && window.FlappyEagle && typeof window.FlappyEagle.init === 'function') {
        window.FlappyEagle.init(gameContainer);
    } else if (!gameContainer) {
        console.error("No se encontró el contenedor del juego Flappy Eagle.");
    }
});
