// Theme toggle logic
const themeToggleBtn = document.getElementById('themeToggleBtn');
const themeIcon = document.getElementById('themeIcon');

function toggleTheme() {
  if (document.body.getAttribute('data-theme') === 'dark') {
    document.body.removeAttribute('data-theme');
    if (themeIcon) themeIcon.textContent = '🌙';
  } else {
    document.body.setAttribute('data-theme', 'dark');
    if (themeIcon) themeIcon.textContent = '☀️';
  }
}

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', toggleTheme);
}

// Simple form validation and feedback (optional, French)
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    alert('Votre message a été envoyé avec succès. Merci de nous avoir contactés !');
    contactForm.reset();
  });
}
