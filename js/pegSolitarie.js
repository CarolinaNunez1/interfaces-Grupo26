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

/* imagen de ficha como data-url SVG (cumple lo de 'imagen en lugar de color sólido') */
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
let board = []; // matriz ROWS x COLS con -1/0/1
let boardEl = document.getElementById("board");
let timerEl = document.getElementById("timer");
let restartBtn = document.getElementById("restart");
let selected = null; // {r,c,cellEl,imgEl}
let floating = null;  // elemento img floter mientras arrastramos
let timeLimit = 300; // segundos por defecto
let timeLeft = timeLimit;
let timerInterval = null;

/* ---------- UTIL ---------- */
function cloneMask(mask){ return mask.map(row => row.slice()); }
function inBounds(r,c){ return r>=0 && r<ROWS && c>=0 && c<COLS; }

/* comprueba movimientos válidos desde (r,c): devuelve array de destinos [{r,c,midR,midC}] */
function validMovesFrom(r,c){
  const moves = [];
  if (!inBounds(r,c) || board[r][c] !== 1) return moves;
  const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for (const [dr,dc] of dirs){
    const r1 = r + dr, c1 = c + dc;       // casilla adyacente (debe tener ficha)
    const r2 = r + dr*2, c2 = c + dc*2;   // destino (debe existir y estar vacío)
    if (inBounds(r1,c1) && inBounds(r2,c2) &&
        board[r1][c1] === 1 && board[r2][c2] === 0){
      moves.push({r:r2,c:c2, midR:r1, midC:c1});
    }
  }
  return moves;
}

/* devuelve true si existe al menos un movimiento en el tablero */
function anyMovesAvailable(){
  for (let r=0;r<ROWS;r++){
    for (let c=0;c<COLS;c++){
      if (board[r][c] === 1 && validMovesFrom(r,c).length>0) return true;
    }
  }
  return false;
}

/* actualiza contador de fichas y timer visual */
function updateStatus(){
  const pegs = board.flat().filter(x => x===1).length;
  const leftEl = document.getElementById("pegsLeft");
  if (leftEl) leftEl.textContent = pegs;
}

/* formato mm:ss */
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
        // celda inválida: hacemos transparente y dejamos sin eventos
        cell.classList.add("empty");
        cell.style.visibility = "hidden"; // opcional: ocultar las posiciones inválidas
      } else {
        // agujero visual: si está vacía usamos clase empty (tu CSS lo maneja)
        if (board[r][c] === 0){
          cell.classList.add("empty");
        } else if (board[r][c] === 1){
          // agregar img
          const img = document.createElement("img");
          img.src = "../img/image.png";
          img.draggable = false;
          img.className = "peg-img";
          // anidamos la imagen dentro de la cell para mantener el layout
          cell.appendChild(img);
        }
        // añadimos eventos pointer para selección y drag
        cell.addEventListener("pointerdown", onPointerDownCell);
      }
      boardEl.appendChild(cell);
    }
  }
  updateStatus();
}

/* reconstruye modelo y DOM desde START_MASK */
function resetBoard(){
  board = cloneMask(START_MASK);
  // convertir -1,-1,1,0 a -1/1/0 (ya están)
  createBoardDOM();
  clearSelection();
  stopTimer();
  timeLimit = parseInt(document.getElementById("timeLimit")?.value || 300, 10);
  if (isNaN(timeLimit) || timeLimit <= 0) timeLimit = 300;
  timeLeft = timeLimit;
  timerEl.textContent = "Tiempo: " + formatTime(timeLeft);
  startTimer();
}

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

/* crea img flotante usada al arrastrar */
function createFloatingImg(src, x, y){
  removeFloating();
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
function moveFloating(x,y){
  if (!floating) return;
  floating.style.left = (x - 30) + "px";
  floating.style.top  = (y - 30) + "px";
}
function removeFloating(){
  if (floating){
    floating.remove();
    floating = null;
  }
}

/* procesa la ejecución de un movimiento: desde (sr,sc) a (dr,dc) con medio (mr,mc) */
function executeMove(sr,sc, dr,dc, mr,mc){
  // actualizar modelo
  board[sr][sc] = 0;
  board[mr][mc] = 0;
  board[dr][dc] = 1;
  // actualizar DOM: re-render sólo las celdas afectadas para evitar romper animaciones
  const srcCell = boardEl.querySelector(`.cell[data-r='${sr}'][data-c='${sc}']`);
  const midCell = boardEl.querySelector(`.cell[data-r='${mr}'][data-c='${mc}']`);
  const dstCell = boardEl.querySelector(`.cell[data-r='${dr}'][data-c='${dc}']`);

  if (srcCell) srcCell.innerHTML = "";
  if (midCell) {
    // animación de eliminación: agregar clase y remover la img
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
    dstCell.innerHTML = "";
    dstCell.appendChild(img);
  }
  updateStatus();
}

/* cuando el pointer se levanta: si hay selección y soltamos sobre un destino válido, movemos */
function onPointerUpDocument(e){
  if (!selected) return endDragCleanup();
  // detectamos la celda bajo el puntero
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const cell = el && el.closest(".cell");
  if (cell && cell.classList.contains("hint")){
    const dr = parseInt(cell.dataset.r,10);
    const dc = parseInt(cell.dataset.c,10);
    // buscar mid entre selected y dest
    const sr = selected.r, sc = selected.c;
    const mr = (sr + dr)/2, mc = (sc + dc)/2;
    // validar que son enteros y que la jugada es válida
    if (Number.isInteger(mr) && Number.isInteger(mc) && board[mr][mc] === 1){
      executeMove(sr,sc,dr,dc,mr,mc);
      // limpiar selección y hints
      clearSelection();
      // después de cada movimiento, verificar si hay movimientos posibles
      if (!anyMovesAvailable()){
        endGame("No quedan movimientos posibles. Juego terminado.");
      }
      return endDragCleanup();
    }
  }
  // si no es válido, volvemos al estado inicial (sin mover)
  endDragCleanup();
}

/* finaliza el drag: limpia floating, listeners, clases */
function endDragCleanup(){
  removeFloating();
  document.removeEventListener("pointermove", onPointerMoveDocument);
  document.removeEventListener("pointerup", onPointerUpDocument);
  // quitar capture si existe
  try { if (selected && selected.cellEl) selected.cellEl.releasePointerCapture && selected.cellEl.releasePointerCapture(); } catch(e){}
  // quitar clase selected (no establecemos selected=null porque click puede reusar)
  const sel = boardEl.querySelector(".cell.selected");
  if (sel) sel.classList.remove("selected");
  selected = null;
  clearHints();
}

/* handler pointermove global para posicionar la imagen flotante */
function onPointerMoveDocument(e){
  moveFloating(e.clientX, e.clientY);
}

/* pointerdown en una celda: puede seleccionar y comenzar drag si hay ficha */
function onPointerDownCell(e){
  // ignorar botones secundarios
  if (e.button !== 0) return;
  const cell = e.currentTarget;
  const r = parseInt(cell.dataset.r,10);
  const c = parseInt(cell.dataset.c,10);
  if (board[r][c] !== 1) return; // sólo si hay ficha

  // evitar text selection y tomar el pointer
  cell.setPointerCapture && cell.setPointerCapture(e.pointerId);

  // seleccionar visualmente
  clearSelection();
  cell.classList.add("selected");
  selected = { r, c, cellEl: cell };

  // mostrar hints
  showHintsFor(r,c);

  // crear floating con la imagen y escuchar movimientos globales
  const img = cell.querySelector("img");
  const src = img ? img.src : "..img/image.png";
  createFloatingImg(src, e.clientX, e.clientY);
  document.addEventListener("pointermove", onPointerMoveDocument);
  document.addEventListener("pointerup", onPointerUpDocument);
}

/* ---------- TIMER ---------- */
function startTimer(){
  stopTimer();
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
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

/* ---------- FIN/JUEGO ---------- */
function endGame(message){
  stopTimer();
  // quitar listeners globales por si acaso
  endDragCleanup();
  setTimeout(()=> {
    alert(message + " Pulsa Reiniciar para jugar otra vez.");
  }, 80);
}

/* ---------- EVENTOS UI ---------- */
restartBtn?.addEventListener("click", (e)=>{
  resetBoard();
});

document.getElementById("timeLimit")?.addEventListener("change", (e)=>{
  // al cambiar el límite actualizamos el timeLeft (no reiniciamos)
  const v = parseInt(e.target.value,10);
  if (!isNaN(v) && v>0){
    timeLimit = v;
    timeLeft = Math.min(timeLeft, timeLimit);
    timerEl.textContent = "Tiempo: " + formatTime(timeLeft);
  }
});

/* ---------- INICIALIZACIÓN ---------- */
function init(){
  // crear campo de pegsLeft si no existe (para compatibilidad con el sidebar anterior)
  if (!document.getElementById("pegsLeft")){
    const info = document.createElement("div");
    info.id = "pegsLeft";
    info.style.display = "none";
    document.body.appendChild(info);
  }
  resetBoard();
}

/* arrancar */
init();
