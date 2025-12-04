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

