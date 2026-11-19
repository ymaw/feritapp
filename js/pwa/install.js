export function isIos(userAgent, msStream) {
  return /iphone|ipad|ipod/i.test(userAgent) && !msStream;
}

export function isStandalone(navigatorStandalone, displayModeMatches) {
  return navigatorStandalone === true || Boolean(displayModeMatches);
}

export function initPwaInstall({
  windowRef = window,
  documentRef = document,
  navigatorRef = navigator,
  menuDropdown
} = {}) {
  const installBanner = documentRef.getElementById('installBanner');
  const menuInstallBtn = documentRef.getElementById('menuInstallBtn');
  let deferredInstallPrompt = null;

  function showInstallBanner() {
    if (windowRef.localStorage.getItem('installBannerDismissed') === '1') return;
    installBanner.style.display = 'flex';
    documentRef.body.style.paddingTop = installBanner.offsetHeight + 'px';
  }

  function forceShowInstallBanner() {
    installBanner.style.display = 'flex';
    documentRef.body.style.paddingTop = installBanner.offsetHeight + 'px';
  }

  function hideInstallBanner() {
    installBanner.style.display = 'none';
    documentRef.body.style.paddingTop = '';
  }

  function deviceIsIos() {
    return isIos(navigatorRef.userAgent, windowRef.MSStream);
  }

  function deviceIsStandalone() {
    const displayModeMatches = windowRef.matchMedia &&
      windowRef.matchMedia('(display-mode: standalone)').matches;
    return isStandalone(navigatorRef.standalone, displayModeMatches);
  }

  windowRef.addEventListener('beforeinstallprompt', function(event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    documentRef.getElementById('installBannerText').textContent = '📲 Instalá la app para acceso rápido';
    documentRef.getElementById('installBannerBtn').style.display = 'inline-block';
    showInstallBanner();
    menuInstallBtn.style.display = 'block';
  });

  documentRef.getElementById('installBannerBtn').addEventListener('click', async function() {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    hideInstallBanner();
    menuInstallBtn.style.display = 'none';
  });

  documentRef.getElementById('installBannerClose').addEventListener('click', function() {
    hideInstallBanner();
    windowRef.localStorage.setItem('installBannerDismissed', '1');
  });

  windowRef.addEventListener('appinstalled', function() {
    hideInstallBanner();
    windowRef.localStorage.setItem('installBannerDismissed', '1');
    menuInstallBtn.style.display = 'none';
    deferredInstallPrompt = null;
  });

  menuInstallBtn.addEventListener('click', function() {
    menuDropdown.style.display = 'none';
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function() {
        deferredInstallPrompt = null;
        menuInstallBtn.style.display = 'none';
      });
    } else if (deviceIsIos() && !deviceIsStandalone()) {
      documentRef.getElementById('installBannerText').textContent = '📲 Instalá FeritApp: tocá Compartir → Agregar a inicio';
      documentRef.getElementById('installBannerBtn').style.display = 'none';
      forceShowInstallBanner();
    }
  });

  if (deviceIsIos() && !deviceIsStandalone()) {
    menuInstallBtn.style.display = 'block';
    documentRef.getElementById('installBannerText').textContent = '📲 Instalá FeritApp: tocá Compartir → Agregar a inicio';
    documentRef.getElementById('installBannerBtn').style.display = 'none';
    showInstallBanner();
  }
}
