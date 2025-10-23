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


// === VARIABLES GLOBALES ===
const board = document.getElementById("board");
const playBtn = document.getElementById("play-btn");
const timerSpan = document.getElementById("timer");
const levelSelect = document.getElementById("level-select");

let pieces = [];
let rotations = [];
let timer = null;
let seconds = 0;
let isPlaying = false;
let level = 1;

// === BANCO DE IMÁGENES ===
const images = [
  "../img/img1.png",
  "../img/img2.png",
  "../img/img3.png",
  "../img/img4.png",
  "../img/img5.png",
  "../img/img6.png",
];

// === MODAL ===
const modal = document.createElement("div");
modal.id = "modal";
modal.classList.add("hidden");
modal.innerHTML = `
  <div class="modal-content">
    <h2 id="modal-title"></h2>
    <div class="modal-buttons">
      <button id="menu-btn">Menú Principal</button>
      <button id="next-btn">Siguiente Nivel</button>
    </div>
  </div>
`;
document.body.appendChild(modal);

const modalTitle = document.getElementById("modal-title");
const menuBtn = document.getElementById("menu-btn");
const nextBtn = document.getElementById("next-btn");

// === INICIAR JUEGO ===
playBtn.addEventListener("click", startGame);

function startGame() {
  if (isPlaying) return;

  level = parseInt(levelSelect.value);
  isPlaying = true;
  seconds = 0;
  timerSpan.textContent = "00:00";
  board.innerHTML = "";

  const imgSrc = images[Math.floor(Math.random() * images.length)];
  createBoard(imgSrc);
  startTimer();
}

// === CREAR TABLERO ===
function createBoard(imgSrc) {
  pieces = [];
  rotations = [];

  for (let i = 0; i < 4; i++) {
    const piece = document.createElement("div");
    piece.classList.add("piece");
    piece.style.backgroundImage = `url(${imgSrc})`;

    if (i === 0) piece.style.backgroundPosition = "0 0";
    if (i === 1) piece.style.backgroundPosition = "100% 0";
    if (i === 2) piece.style.backgroundPosition = "0 100%";
    if (i === 3) piece.style.backgroundPosition = "100% 100%";

    // Filtro según nivel
    if (level === 1) piece.style.filter = "grayscale(100%)";
    if (level === 2) piece.style.filter = "brightness(70%)";
    if (level === 3) piece.style.filter = "invert(100%)";

    let rot = [0, 90, 180, 270][Math.floor(Math.random() * 4)];
    piece.style.transform = `rotate(${rot}deg)`;
    rotations.push(rot);

    // Click izquierdo/derecho
    piece.addEventListener("click", () => rotatePiece(piece, i, "left"));
    piece.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      rotatePiece(piece, i, "right");
    });

    board.appendChild(piece);
    pieces.push(piece);
  }
}

// === ROTAR PIEZA ===
function rotatePiece(piece, index, direction) {
  if (!isPlaying) return;

  rotations[index] =
    direction === "right"
      ? (rotations[index] + 90) % 360
      : (rotations[index] + 270) % 360;

  piece.style.transform = `rotate(${rotations[index]}deg)`;
  checkWin();
}

// === COMPROBAR VICTORIA ===
function checkWin() {
  if (rotations.every((r) => r === 0)) {
    stopTimer();
    isPlaying = false;
    pieces.forEach((p) => (p.style.filter = "none"));
    showModal("¡Ganaste!");
  }
}

// === TEMPORIZADOR ===
function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    seconds++;
    const min = String(Math.floor(seconds / 60)).padStart(2, "0");
    const sec = String(seconds % 60).padStart(2, "0");
    timerSpan.textContent = `${min}:${sec}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timer);
}

// === MODAL ===
function showModal(text) {
  modalTitle.textContent = text;
  modal.classList.remove("hidden");
}

menuBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  isPlaying = false;
  board.innerHTML = "";
  timerSpan.textContent = "00:00";
});

nextBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  level = Math.min(level + 1, 3);
  levelSelect.value = level;
  startGame();
});
