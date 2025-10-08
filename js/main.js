/* ===== main.js ===== */

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

// --- LOADER SIMULADO ---
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  const progressText = document.getElementById("progress");

  if (!loader || !progressText) return; // si no existe, salir

  let progress = 0;
  const interval = setInterval(() => {
    progress += 2; // 2% cada 100 ms → 5 s total
    if (progress > 100) progress = 100;
    progressText.textContent = `${progress}%`;

    if (progress === 100) {
      clearInterval(interval);
      setTimeout(() => {
        loader.classList.add("fade-out");
        // lo eliminamos del DOM luego de la transición
        loader.addEventListener(
          "transitionend",
          () => loader.remove(),
          { once: true }
        );
      }, 300);
    }
  }, 100);
});

// === CARRUSEL DE JUEGOS ===
const track = document.querySelector(".carousel-track");
const nextBtn = document.querySelector(".carousel-btn.next");
const prevBtn = document.querySelector(".carousel-btn.prev");

if (track && nextBtn && prevBtn) {
  let index = 0;
  const cards = document.querySelectorAll(".carousel-track .game-card");
  const visibleCards = 3; // cantidad visible según ancho
  const totalCards = cards.length;

  const updateCarousel = () => {
    const cardWidth = cards[0].offsetWidth + 20; // ancho + gap
    track.style.transform = `translateX(-${index * cardWidth}px)`;
  };

  nextBtn.addEventListener("click", () => {
    if (index < totalCards - visibleCards) index++;
    else index = 0; // reinicia
    updateCarousel();
  });

  prevBtn.addEventListener("click", () => {
    if (index > 0) index--;
    else index = totalCards - visibleCards;
    updateCarousel();
  });

  // opcional: movimiento automático
  setInterval(() => {
    if (index < totalCards - visibleCards) index++;
    else index = 0;
    updateCarousel();
  }, 4000);
}
