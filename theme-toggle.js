// theme-toggle.js
(function() {
  // Tema durumunu localStorage'dan al
  const getTheme = () => localStorage.getItem('theme') || 'dark';
  const setTheme = t => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
    updateBtnIcon(t);
  };

  // Butona uygun ikon ve tooltip koy
  function updateBtnIcon(theme) {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    if (theme === 'dark') {
      btn.innerHTML = '☀️';
      btn.title = 'Mode clair';
      btn.setAttribute('aria-label', 'Mode clair');
    } else {
      btn.innerHTML = '🌙';
      btn.title = 'Mode sombre';
      btn.setAttribute('aria-label', 'Mode sombre');
    }
  }

  // Butonu ekle
  function injectBtn() {
    // Zaten eklenmişse tekrar ekleme
    if (document.getElementById('theme-toggle-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'theme-toggle-btn';
    btn.style.cssText = `
      position: fixed;
      right: 20px; bottom: 22px;
      z-index: 90;
      width: 39px; height: 39px;
      border-radius: 50%;
      border: none;
      background: #001F54cc;
      color: #fff;
      box-shadow: 0 2px 10px #001f5444;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.44em; cursor: pointer;
      transition: background 0.2s, color 0.2s, transform 0.1s;
      opacity: 0.85;
    `;
    btn.addEventListener('mouseenter', () => btn.style.opacity = 1);
    btn.addEventListener('mouseleave', () => btn.style.opacity = 0.85);
    btn.addEventListener('mousedown', () => btn.style.transform = 'scale(0.92)');
    btn.addEventListener('mouseup', () => btn.style.transform = '');
    btn.addEventListener('blur', () => btn.style.transform = '');
    btn.addEventListener('click', () => {
      setTheme(getTheme() === 'dark' ? 'light' : 'dark');
    });

    document.body.appendChild(btn);
    updateBtnIcon(getTheme());
  }

  // Tema uygulama
  function applyThemeOnLoad() {
    setTheme(getTheme());
  }

  // DOM yüklendiğinde uygula
  document.addEventListener('DOMContentLoaded', function() {
    injectBtn();
    applyThemeOnLoad();
  });
})();
