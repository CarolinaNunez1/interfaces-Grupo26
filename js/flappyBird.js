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
