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
// JUEGO 
/* ---------- CONFIG y MASCARA ---------- */
const ROWS = 7;
const COLS = 7;

/* máscara clásica: -1 = inválida, 1 = ficha, 0 = vacío (centro) */
const START_MASK = [
  [ -1, -1, 1, 1, 1, -1, -1 ],
  [ -1, -1, 1, 1, 1, -1, -1 ],
  [  1,  1, 1, 1, 1,  1,  1 ],
  [  1,  1, 1, 0, 1,  1,  1 ],
  [  1,  1, 1, 1, 1,  1,  1 ],
  [ -1, -1, 1, 1, 1, -1, -1 ],
  [ -1, -1, 1, 1, 1, -1, -1 ]
];

let gameRunning = false;//indica si el timer esta activo

/* imagen de ficha como data-url SVG */
const PEG_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
     <defs>
       <radialGradient id='g' cx='30%' cy='30%'>
         <stop offset='0' stop-color='#fff'/>
         <stop offset='1' stop-color='#ff9bb3'/>
       </radialGradient>
     </defs>
     <circle cx='50' cy='45' r='26' fill='url(#g)' stroke='#c14f6a' stroke-width='3'/>
     <ellipse cx='50' cy='72' rx='28' ry='8' fill='#d88' opacity='0.9'/>
  </svg>`
);

/* ---------- ESTADO ---------- */
let board = [];//matriz del tablero
let boardEl = document.getElementById("board");//contenedor del tablero
let timerEl = document.getElementById("timer");//elemento del timer
let restartBtn = document.getElementById("restart");//btn reiniciar
let startBtn = document.getElementById("start");//btn iniciar
let selected = null;//objeto con la celda seleccionada 
let floating = null;//imagen flotante
let timeLimit = 300;//limite inical en sg
let timeLeft = timeLimit;//tiempo restante
let timerInterval = null;//id del intervalo del timer

/* ---------- UTIL ---------- */
function cloneMask(mask){ return mask.map(row => row.slice()); }
function inBounds(r,c){ return r>=0 && r<ROWS && c>=0 && c<COLS; }

/* comprueba movimientos válidos desde (r,c) */
function validMovesFrom(r,c){
  const moves = [];
  if (!inBounds(r,c) || board[r][c] !== 1) return moves;
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr,dc] of dirs){
    const r1 = r + dr, c1 = c + dc;
    const r2 = r + dr*2, c2 = c + dc*2;
    if (inBounds(r1,c1) && inBounds(r2,c2) &&
        board[r1][c1] === 1 && board[r2][c2] === 0){
      moves.push({r:r2,c:c2, midR:r1, midC:c1});
    }
  }
  return moves;
}
//recorre todo el tablero y devuelve true si existe
function anyMovesAvailable(){
  for (let r=0;r<ROWS;r++){
    for (let c=0;c<COLS;c++){
      if (board[r][c] === 1 && validMovesFrom(r,c).length>0) return true;
    }
  }
  return false;
}
//actualiza el contador de fichas
function updateStatus(){
  const pegs = board.flat().filter(x => x===1).length;
  const leftEl = document.getElementById("pegsLeft");
  if (leftEl) leftEl.textContent = pegs;
}
//convierte segundos a formato mm:ss
function formatTime(s){
  const mm = String(Math.floor(s/60)).padStart(2,'0');
  const ss = String(s%60).padStart(2,'0');
  return `${mm}:${ss}`;
}

/* ---------- RENDER TABLERO ---------- */
function createBoardDOM(){
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, 70px)`;
  boardEl.style.gridTemplateRows = `repeat(${ROWS}, 70px)`;

  for (let r=0;r<ROWS;r++){
    for (let c=0;c<COLS;c++){
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.r = r;
      cell.dataset.c = c;

      if (board[r][c] === -1){
        cell.classList.add("empty");
        cell.style.visibility = "hidden";
      } else {
        if (board[r][c] === 0){
          cell.classList.add("empty");
        } else if (board[r][c] === 1){
          const img = document.createElement("img");
          img.src = "../img/image.png";
          img.draggable = false;
          img.className = "peg-img";
          img.style.filter = `drop-shadow(0 0 6px ${colorSeleccionado}) saturate(1.8)`;
          cell.appendChild(img);
        }
        cell.addEventListener("pointerdown", onPointerDownCell);
      }
      boardEl.appendChild(cell);
    }
  }
  updateStatus();
}
//vuleve a estado inicial
function resetBoard() {
  board = cloneMask(START_MASK);
  createBoardDOM();
  clearSelection();
  stopTimer();

  timeLimit = parseInt(document.getElementById("timeLimit")?.value || 300, 10);
  if (isNaN(timeLimit) || timeLimit <= 0) timeLimit = 300;

  timeLeft = timeLimit;
  timerEl.textContent = "Tiempo: " + formatTime(timeLeft);
  updateStatus();
  gameRunning = false;
}

/* ---------- INICIAR = REINICIAR + INICIAR TIMER ---------- */
startBtn?.addEventListener("click", () => {
  resetBoard();
  startTimer();
});

/* ---------- SELECCIÓN, HINTS y DRAG & DROP ---------- */
function clearHints(){
  const prev = boardEl.querySelectorAll(".cell.hint");
  prev.forEach(x => x.classList.remove("hint"));
}
function clearSelection(){
  const prevSel = boardEl.querySelector(".cell.selected");
  if (prevSel) prevSel.classList.remove("selected");
  selected = null;
  clearHints();
  removeFloating();
}

function showHintsFor(r,c){
  clearHints();
  const moves = validMovesFrom(r,c);
  for (const m of moves){
    const cell = boardEl.querySelector(`.cell[data-r='${m.r}'][data-c='${m.c}']`);
    if (cell) cell.classList.add("hint");
  }
}
//crea imagen fija que sigue el cursor durante el drag 
function createFloatingImg(src, x, y){
  removeFloating();//si ya habia floting lo elimina
  const img = document.createElement("img");
  img.src = "../img/image.png";
  img.style.position = "fixed";
  img.style.width = "60px";
  img.style.height = "60px";
  img.style.pointerEvents = "none";
  img.style.left = (x - 30) + "px";
  img.style.top  = (y - 30) + "px";
  img.className = "floating-peg";
  document.body.appendChild(img);
  floating = img;
  return img;
}
//actualiza la posicion de la imagen flotante
function moveFloating(x,y){
  if (!floating) return;
  floating.style.left = (x - 30) + "px";
  floating.style.top  = (y - 30) + "px";
}
//elimina la imagen flotante
function removeFloating(){
  if (floating){
    floating.remove();
    floating = null;
  }
}
//aplica el salto y actualiza el dom
function executeMove(sr,sc, dr,dc, mr,mc){
  board[sr][sc] = 0;
  board[mr][mc] = 0;
  board[dr][dc] = 1;

  const srcCell = boardEl.querySelector(`.cell[data-r='${sr}'][data-c='${sc}']`);
  const midCell = boardEl.querySelector(`.cell[data-r='${mr}'][data-c='${mc}']`);
  const dstCell = boardEl.querySelector(`.cell[data-r='${dr}'][data-c='${dc}']`);

  if (srcCell) srcCell.innerHTML = "";
  if (midCell) {
    midCell.classList.add("eliminada");
    midCell.innerHTML = "";
    setTimeout(()=> midCell.classList.remove("eliminada"), 350);
  }
  if (dstCell) {
    dstCell.classList.remove("empty");
    const img = document.createElement("img");
    img.src = "../img/image.png";
    img.draggable = false;
    img.className = "peg-img";
    img.style.filter = `drop-shadow(0 0 6px ${colorSeleccionado}) saturate(1.8)`;
    dstCell.innerHTML = "";
    dstCell.appendChild(img);
  }
  updateStatus();
}
//manejador global que se ejecuta al soltar el puntero
function onPointerUpDocument(e){
  if (!selected) return endDragCleanup();

  const el = document.elementFromPoint(e.clientX, e.clientY);
  const cell = el && el.closest(".cell");
  if (cell && cell.classList.contains("hint")){
    const dr = parseInt(cell.dataset.r,10);
    const dc = parseInt(cell.dataset.c,10);
    const sr = selected.r, sc = selected.c;
    const mr = (sr + dr)/2, mc = (sc + dc)/2;

    if (Number.isInteger(mr) && Number.isInteger(mc) && board[mr][mc] === 1){
      executeMove(sr,sc,dr,dc,mr,mc);
      clearSelection();
      if (!anyMovesAvailable()){
        endGame("No quedan movimientos posibles. Juego terminado.");
      }
      return endDragCleanup();
    }
  }
  endDragCleanup();
}
// endDragCleanup: remueve floating, listeners y limpia selección/hints
function endDragCleanup(){
  removeFloating();
  document.removeEventListener("pointermove", onPointerMoveDocument);
  document.removeEventListener("pointerup", onPointerUpDocument);
  try { if (selected && selected.cellEl) selected.cellEl.releasePointerCapture && selected.cellEl.releasePointerCapture(); } catch(e){}
  const sel = boardEl.querySelector(".cell.selected");
  if (sel) sel.classList.remove("selected");
  selected = null;
  clearHints();
}

function onPointerMoveDocument(e){
  moveFloating(e.clientX, e.clientY);
}
//mueve la imagen flotante siguiendo el cursor
function onPointerDownCell(e){

  if (!gameRunning) {
    alert("Primero presioná INICIAR para comenzar.");
    return;
  }

  if (e.button !== 0) return;
  const cell = e.currentTarget;
  const r = parseInt(cell.dataset.r,10);
  const c = parseInt(cell.dataset.c,10);
  if (board[r][c] !== 1) return;

  cell.setPointerCapture && cell.setPointerCapture(e.pointerId);

  clearSelection();
  cell.classList.add("selected");
  selected = { r, c, cellEl: cell };

  showHintsFor(r,c);

  const img = cell.querySelector("img");
  const src = img ? img.src : "..img/image.png";
  createFloatingImg(src, e.clientX, e.clientY);
  document.addEventListener("pointermove", onPointerMoveDocument);
  document.addEventListener("pointerup", onPointerUpDocument);
}

/* ---------- TIMER ---------- */
function startTimer(){
  stopTimer();
  gameRunning = true;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = "Tiempo: " + formatTime(timeLeft);
    if (timeLeft <= 0){
      stopTimer();
      endGame("Se terminó el tiempo. Juego finalizado.");
    }
  }, 1000);
}
function stopTimer(){
  gameRunning = false;
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

/* ---------- FIN/JUEGO ---------- */
function endGame(message){
  stopTimer();
  endDragCleanup();
  setTimeout(()=> {
    alert(message + " Pulsa Reiniciar para jugar otra vez.");
  }, 80);
}

/* ---------- EVENTOS UI ---------- */
restartBtn?.addEventListener("click", ()=>{
  resetBoard();
});

document.getElementById("timeLimit")?.addEventListener("change", (e)=>{
  const v = parseInt(e.target.value,10);
  if (!isNaN(v) && v>0){
    timeLimit = v;
    timeLeft = Math.min(timeLeft, timeLimit);
    timerEl.textContent = "Tiempo: " + formatTime(timeLeft);
  }
});

/* ---------- INICIALIZACIÓN ---------- */
function init(){
  if (!document.getElementById("pegsLeft")){
    const info = document.createElement("div");
    info.id = "pegsLeft";
    info.style.display = "none";
    document.body.appendChild(info);
  }
  resetBoard();
}

let colorSeleccionado = "#ffffff";

document.querySelectorAll(".color-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {

    if (gameRunning){
      alert("No podés cambiar el color mientras el juego está corriendo.");
      return;
    }

    document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("selected"));
    e.currentTarget.classList.add("selected");

    colorSeleccionado = e.currentTarget.dataset.color;

    document.querySelectorAll(".cell img").forEach(img => {
      img.style.filter = `drop-shadow(0 0 6px ${colorSeleccionado}) saturate(1.8)`;
    });
  });
});