// Theme toggle script - persists user choice in localStorage
(function() {
  function setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) btn.innerHTML = theme === 'dark'
      ? '<i class="fas fa-moon"></i> Karanlık Mod'
      : '<i class="fas fa-sun"></i> Aydınlık Mod';
  }
  window.toggleTheme = function() {
    const current = document.body.getAttribute('data-theme') || 'light';
    setTheme(current === 'light' ? 'dark' : 'light');
  };
  // On load, set theme
  const saved = localStorage.getItem('theme');
  setTheme(saved === 'dark' ? 'dark' : 'light');
})();
