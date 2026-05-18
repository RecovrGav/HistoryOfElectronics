const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

function setTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('history-electronics-theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
});

const savedTheme = localStorage.getItem('history-electronics-theme');
if (savedTheme) {
  setTheme(savedTheme);
}
