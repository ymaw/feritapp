/**
 * Theme preference wiring.
 * The inline head bootstrap remains in index.html to avoid a theme flash before CSS loads.
 */

const THEME_KEY = 'feritapp-theme';

export function resolveThemeIsDark(choice, systemPrefersDark) {
  if (choice === 'dark') return true;
  if (choice === 'light') return false;
  return Boolean(systemPrefersDark);
}

export function initThemePreferences() {
  function applyTheme(choice) {
    const isDark = resolveThemeIsDark(
      choice,
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.querySelectorAll('.theme-opt').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-theme-choice') === choice);
    });
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDark ? '#14101f' : '#7c3aed');
    }
  }

  function setTheme(choice) {
    try {
      localStorage.setItem(THEME_KEY, choice);
    } catch (error) {}
    applyTheme(choice);
  }

  document.querySelectorAll('.theme-opt').forEach(function(btn) {
    btn.addEventListener('click', function() {
      setTheme(btn.getAttribute('data-theme-choice'));
    });
  });

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
      let current = 'system';
      try {
        current = localStorage.getItem(THEME_KEY) || 'system';
      } catch (error) {}
      if (current === 'system') applyTheme('system');
    });
  }

  let saved = 'system';
  try {
    saved = localStorage.getItem(THEME_KEY) || 'system';
  } catch (error) {}
  applyTheme(saved);
}
