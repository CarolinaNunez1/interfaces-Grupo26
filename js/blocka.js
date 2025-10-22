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
const board = document.getElementById('board');
const div = document.createElement('div');
div.classList.add('piece');
div.style.backgroundImage = `url(${img})`;


const x = (i % size) * -100;
const y = Math.floor(i / size) * -100;
div.style.backgroundPosition = `${x}px ${y}px`;


div.dataset.rotation = Math.floor(Math.random() * 4) * 90;
div.style.transform = `rotate(${div.dataset.rotation}deg)`;


div.addEventListener('click', () => rotatePiece(div, 90));
div.addEventListener('contextmenu', (e) => {
e.preventDefault();
rotatePiece(div, -90);
});


board.appendChild(div);
pieces.push(div);


function rotatePiece(piece, deg) {
if (!isPlaying) return;
const newRotation = (parseInt(piece.dataset.rotation) + deg + 360) % 360;
piece.dataset.rotation = newRotation;
piece.style.transform = `rotate(${newRotation}deg)`;


checkWin();
}


function checkWin() {
const allCorrect = pieces.every(p => parseInt(p.dataset.rotation) === 0);
if (allCorrect) {
clearInterval(timer);
modalTitle.textContent = '¡Ganaste!';
modal.classList.remove('hidden');
isPlaying = false;
}
}


function resetTimer() {
clearInterval(timer);
timeLeft = 60 - (level * 10);
timerSpan.textContent = `Tiempo: ${timeLeft}s`;
}


function startTimer() {
timer = setInterval(() => {
timeLeft--;
timerSpan.textContent = `Tiempo: ${timeLeft}s`;
if (timeLeft <= 0) {
clearInterval(timer);
modalTitle.textContent = '¡Se acabó el tiempo!';
modal.classList.remove('hidden');
isPlaying = false;
}
}, 1000);
}


function useHelp() {
if (!isPlaying) return;
timeLeft += 5;
timerSpan.textContent = `Tiempo: ${timeLeft}s`;
const piece = pieces[Math.floor(Math.random() * pieces.length)];
piece.dataset.rotation = 0;
piece.style.transform = 'rotate(0deg)';
}