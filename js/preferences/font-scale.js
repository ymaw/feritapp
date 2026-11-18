/**
 * Global font-scale preference wiring.
 * The inline head bootstrap remains in index.html to apply the saved scale before CSS paints.
 */

const FONT_SCALE_KEY = 'feritapp-font-scale';
const FONT_SCALE_PRESETS = ['0.9', '1', '1.15', '1.3', '1.5'];

export function normalizeFontScale(value) {
  const scale = String(value);
  return FONT_SCALE_PRESETS.includes(scale) ? scale : '1';
}

export function initFontScalePreferences() {
  function applyFontScale(value) {
    const scale = normalizeFontScale(value);
    document.documentElement.style.setProperty('--font-scale', scale);
    document.querySelectorAll('[data-font-scale]').forEach(function(btn) {
      const selected = btn.getAttribute('data-font-scale') === scale;
      btn.classList.toggle('active', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
    const label = document.getElementById('fontScaleLabel');
    if (label) label.textContent = 'Tamaño actual: ' + Math.round(Number(scale) * 100) + '%';
  }

  function setFontScale(value) {
    const scale = normalizeFontScale(value);
    try {
      localStorage.setItem(FONT_SCALE_KEY, scale);
    } catch (error) {}
    applyFontScale(scale);
  }

  document.querySelectorAll('.font-scale-option').forEach(function(btn) {
    btn.addEventListener('click', function() {
      setFontScale(btn.getAttribute('data-font-scale'));
    });
  });

  const resetFontScaleBtn = document.getElementById('resetFontScale');
  if (resetFontScaleBtn) {
    resetFontScaleBtn.addEventListener('click', function() {
      setFontScale('1');
    });
  }

  let saved = '1';
  try {
    saved = localStorage.getItem(FONT_SCALE_KEY) || '1';
  } catch (error) {}
  applyFontScale(saved);
}
