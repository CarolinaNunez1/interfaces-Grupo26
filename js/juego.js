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