const path = require('node:path');
const { pathToFileURL } = require('node:url');
const assert = require('node:assert/strict');

(async function runPwaInstallCharacterizationTests() {
  const moduleUrl = pathToFileURL(path.join(__dirname, '..', 'js', 'pwa', 'install.js')).href;
  const { initPwaInstall, isIos, isStandalone } = await import(moduleUrl);

  assert.equal(isIos('Mozilla/5.0 (iPhone)', undefined), true);
  assert.equal(isIos('Mozilla/5.0 (iPad)', undefined), true);
  assert.equal(isIos('Mozilla/5.0 (Android)', undefined), false);
  assert.equal(isIos('Mozilla/5.0 (iPhone)', true), false);
  assert.equal(isStandalone(true, false), true);
  assert.equal(isStandalone(false, true), true);
  assert.equal(isStandalone(false, false), false);

  function makeElement(height = 48) {
    const listeners = {};
    return {
      style: {},
      textContent: '',
      offsetHeight: height,
      addEventListener(name, callback) { listeners[name] = callback; },
      async click() { if (listeners.click) return listeners.click(); },
      dispatch(name, event = {}) { if (listeners[name]) return listeners[name](event); }
    };
  }

  function makeEnvironment({ userAgent = 'Android', standalone = false, dismissed = false } = {}) {
    const elements = {
      installBanner: makeElement(),
      menuInstallBtn: makeElement(),
      installBannerText: makeElement(),
      installBannerBtn: makeElement(),
      installBannerClose: makeElement()
    };
    const windowListeners = {};
    const storage = new Map();
    if (dismissed) storage.set('installBannerDismissed', '1');
    const windowRef = {
      MSStream: undefined,
      localStorage: {
        getItem(key) { return storage.get(key) ?? null; },
        setItem(key, value) { storage.set(key, String(value)); }
      },
      addEventListener(name, callback) { windowListeners[name] = callback; },
      matchMedia() { return { matches: false }; },
      dispatch(name, event = {}) { if (windowListeners[name]) return windowListeners[name](event); }
    };
    const navigatorRef = { userAgent, standalone };
    const documentRef = {
      body: { style: {} },
      getElementById(id) { return elements[id]; }
    };
    const menuDropdown = { style: {} };
    initPwaInstall({ windowRef, documentRef, navigatorRef, menuDropdown });
    return { elements, windowRef, navigatorRef, documentRef, menuDropdown, storage };
  }

  const android = makeEnvironment();
  let prevented = false;
  let promptCalls = 0;
  android.windowRef.dispatch('beforeinstallprompt', {
    preventDefault() { prevented = true; },
    prompt() { promptCalls += 1; },
    userChoice: Promise.resolve({ outcome: 'accepted' })
  });
  assert.equal(prevented, true, 'Android install prompt must be deferred');
  assert.equal(android.elements.installBanner.style.display, 'flex');
  assert.equal(android.elements.installBannerBtn.style.display, 'inline-block');
  assert.equal(android.elements.menuInstallBtn.style.display, 'block');
  assert.match(android.elements.installBannerText.textContent, /acceso rápido/);
  await android.elements.installBannerBtn.click();
  assert.equal(promptCalls, 1);
  assert.equal(android.elements.installBanner.style.display, 'none');
  assert.equal(android.elements.menuInstallBtn.style.display, 'none');
  assert.equal(android.documentRef.body.style.paddingTop, '');

  const ios = makeEnvironment({ userAgent: 'Mozilla/5.0 (iPhone)', dismissed: true });
  assert.equal(ios.elements.menuInstallBtn.style.display, 'block');
  assert.equal(ios.elements.installBanner.style.display, 'none', 'dismissed banner stays hidden on initial iOS display');
  await ios.elements.menuInstallBtn.click();
  assert.equal(ios.menuDropdown.style.display, 'none');
  assert.equal(ios.elements.installBanner.style.display, 'flex', 'menu action can force-show iOS instructions');
  assert.equal(ios.elements.installBannerBtn.style.display, 'none');
  assert.match(ios.elements.installBannerText.textContent, /Compartir → Agregar a inicio/);

  const installed = makeEnvironment();
  installed.elements.installBanner.style.display = 'flex';
  installed.windowRef.dispatch('appinstalled');
  assert.equal(installed.elements.installBanner.style.display, 'none');
  assert.equal(installed.elements.menuInstallBtn.style.display, 'none');
  assert.equal(installed.storage.get('installBannerDismissed'), '1');

  const closed = makeEnvironment();
  closed.elements.installBanner.style.display = 'flex';
  await closed.elements.installBannerClose.click();
  assert.equal(closed.elements.installBanner.style.display, 'none');
  assert.equal(closed.storage.get('installBannerDismissed'), '1');

  console.log('OK PWA install: Android deferred prompt, iOS manual instructions, dismissal and appinstalled.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
