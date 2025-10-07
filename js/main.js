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
