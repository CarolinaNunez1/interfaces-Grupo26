const menuButton = document.querySelector('.menu-button');
const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.overlay');

if (menuButton && sidebar && overlay) {
  menuButton.addEventListener('click', () => {
    menuButton.classList.toggle('open');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
  });

  // Cierra menú al hacer clic en el fondo oscuro
  overlay.addEventListener('click', () => {
    menuButton.classList.remove('open');
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  });
}
