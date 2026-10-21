document.addEventListener('DOMContentLoaded', function(){
  "use strict";

  /* =========================================================
     ACCESO: correo + contraseña con Supabase Auth
     =========================================================
     Completá estos 2 datos con los de TU proyecto de Supabase
     (Settings → API): Project URL y la clave "anon public".
     Nunca pongas acá la clave "service_role".
  ========================================================= */
  const SUPABASE_URL = "https://tzajchnflgvdbmiwfyvj.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_IZtlTCgLYAJCRuLBaDvlkQ_yhHfOIcE";

  const SUPABASE_READY = SUPABASE_URL.indexOf("PEGAR_") !== 0
                     && SUPABASE_ANON_KEY.indexOf("PEGAR_") !== 0
                     && typeof supabase !== 'undefined';

  const sb = SUPABASE_READY ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }) : null;
  let entered = false;
  document.body.classList.add('auth-locked');

  /* =========================================================
     ACCESO: correo + contraseña con Supabase Auth
     =========================================================
     El correo se confirma UNA sola vez, al crear la cuenta.
     Las próximas veces, se valida correo + contraseña directamente
     contra Supabase (signInWithPassword) — sin reenviar nada.
  ========================================================= */

  function isValidEmail(v){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  // Mínimo 6 caracteres, al menos 1 mayúscula, 1 número y 1 símbolo.
  function isValidPassword(v){
    return /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$/.test(v);
  }
  function showGateError(msg){
    let err = document.getElementById('gateError');
    err.textContent = msg;
    err.style.display = 'block';
  }

  function checkGateInputs(){
    document.getElementById('gateError').style.display = 'none';
  }

  function updatePwRequirements(){
    let pin = document.getElementById('gatePin').value;
    setReq('reqLength', pin.length >= 6);
    setReq('reqUpper', /[A-Z]/.test(pin));
    setReq('reqNumber', /[0-9]/.test(pin));
    setReq('reqSymbol', /[^A-Za-z0-9]/.test(pin));
  }
  function setReq(id, ok){
    let el = document.getElementById(id);
    if(!el) return;
    el.querySelector('.req-icon').textContent = ok ? '✓' : '✕';
    el.classList.toggle('req-ok', ok);
    el.classList.toggle('req-bad', !ok);
  }

  ['gateEmail','gatePin','gatePinConfirm'].forEach(function(id){
    document.getElementById(id).addEventListener('input', checkGateInputs);
  });
  document.getElementById('gatePin').addEventListener('input', updatePwRequirements);

  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');

  loginBtn.addEventListener('click', async function(){
    let email = document.getElementById('gateEmail').value.trim().toLowerCase();
    let pin = document.getElementById('gatePin').value;

    if(!isValidEmail(email)){ showGateError('Ingresá un correo electrónico válido.'); return; }
    if(!pin){ showGateError('Ingresá tu contraseña.'); return; }
    if(!SUPABASE_READY){ showGateError('Todavía no se configuró Supabase (faltan la URL y la clave del proyecto en script.js).'); return; }

    loginBtn.disabled = true; signupBtn.disabled = true;

    let loginRes = await sb.auth.signInWithPassword({ email: email, password: pin });

    loginBtn.disabled = false; signupBtn.disabled = false;

    if(loginRes.error){
      showGateError('Correo o contraseña incorrectos.');
      return;
    }
    if(loginRes.data && loginRes.data.user){ enterApp(loginRes.data.user); }
  });

  signupBtn.addEventListener('click', async function(){
    let confirmField = document.getElementById('pinConfirmField');

    // Primer click en "Crear cuenta": solo revela confirmar contraseña + el checklist.
    // No envía nada todavía — recién en el segundo click se procesa el alta.
    if(confirmField.style.display === 'none'){
      confirmField.style.display = 'block';
      updatePwRequirements();
      document.getElementById('gatePinConfirm').focus();
      return;
    }

    let email = document.getElementById('gateEmail').value.trim().toLowerCase();
    let pin = document.getElementById('gatePin').value;
    let pinConfirm = document.getElementById('gatePinConfirm').value;

    if(!isValidEmail(email)){ showGateError('Ingresá un correo electrónico válido.'); return; }
    if(!isValidPassword(pin)){ showGateError('La contraseña necesita mínimo 6 caracteres, con una mayúscula, un número y un símbolo.'); return; }
    if(pin !== pinConfirm){ showGateError('Las contraseñas no coinciden.'); return; }
    if(!SUPABASE_READY){ showGateError('Todavía no se configuró Supabase (faltan la URL y la clave del proyecto en script.js).'); return; }

    loginBtn.disabled = true; signupBtn.disabled = true;

    let redirectTo = window.location.origin + window.location.pathname;
    let signUpRes = await sb.auth.signUp({
      email: email,
      password: pin,
      options: { emailRedirectTo: redirectTo }
    });

    loginBtn.disabled = false; signupBtn.disabled = false;

    if(signUpRes.error){
      showGateError(
        /registered|exists/i.test(signUpRes.error.message)
          ? 'Ese correo ya tiene una cuenta creada. Usá "Iniciar sesión".'
          : 'No se pudo crear la cuenta: ' + signUpRes.error.message
      );
      return;
    }

    document.getElementById('gateSentTitle').textContent = '¡Cuenta creada!';
    document.getElementById('gateSentText').innerHTML =
      '📩 Te enviamos un correo de confirmación a <strong>' + escapeHtml(email) + '</strong>. Abrilo una sola vez para activar tu cuenta — de ahí en más, entrás directo con tu correo y contraseña, sin más correos.';
    document.getElementById('gateStep1').style.display = 'none';
    document.getElementById('gateSent').style.display = 'block';
  });

  document.getElementById('forgotPinBtn').addEventListener('click', async function(){
    let email = document.getElementById('gateEmail').value.trim().toLowerCase();
    if(!isValidEmail(email)){
      showGateError('Escribí tu correo arriba y volvé a tocar "Olvidé mi contraseña".');
      return;
    }
    if(!SUPABASE_READY){ showGateError('Falta configurar Supabase.'); return; }

    let redirectTo = window.location.origin + window.location.pathname;
    let res = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectTo });
    if(res.error){
      showGateError('No se pudo enviar el correo de recuperación: ' + res.error.message);
      return;
    }
    document.getElementById('gateSentTitle').textContent = 'Revisá tu correo';
    document.getElementById('gateSentText').innerHTML =
      '📩 Te enviamos un link para elegir una contraseña nueva a <strong>' + escapeHtml(email) + '</strong>. Abrilo desde este dispositivo.';
    document.getElementById('gateStep1').style.display = 'none';
    document.getElementById('gateSent').style.display = 'block';
  });

  document.getElementById('backToEmailBtn').addEventListener('click', function(){
    document.getElementById('gateSent').style.display = 'none';
    document.getElementById('gateStep1').style.display = 'block';
    document.getElementById('pinConfirmField').style.display = 'none';
    document.getElementById('gatePinConfirm').value = '';
  });

  document.getElementById('newPinSubmit').addEventListener('click', async function(){
    let p1 = document.getElementById('newPin').value;
    let p2 = document.getElementById('newPinConfirm').value;
    let err = document.getElementById('newPinError');
    err.style.display = 'none';

    if(!isValidPassword(p1)){ err.textContent = 'Mínimo 6 caracteres, con una mayúscula, un número y un símbolo.'; err.style.display = 'block'; return; }
    if(p1 !== p2){ err.textContent = 'Las contraseñas no coinciden.'; err.style.display = 'block'; return; }

    let res = await sb.auth.updateUser({ password: p1 });
    if(res.error){
      err.textContent = 'No se pudo guardar la contraseña: ' + res.error.message;
      err.style.display = 'block';
      return;
    }
    document.getElementById('gateNewPin').style.display = 'none';
    if(res.data && res.data.user){ enterApp(res.data.user); }
  });

  document.getElementById('logoutBtn').addEventListener('click', async function(){
    if(sb){ await sb.auth.signOut(); }
    location.reload();
  });
  document.getElementById('sidebarLogoutBtn').addEventListener('click', async function(){
    if(sb){ await sb.auth.signOut(); }
    location.reload();
  });

  document.getElementById('logoutAllBtn').addEventListener('click', async function(){
    if(!confirm('¿Cerrar la sesión en TODOS los dispositivos donde esté iniciada (celular, compu, etc.)? Vas a tener que volver a ingresar con tu correo y contraseña en todos ellos.')) return;
    if(sb){ await sb.auth.signOut({ scope: 'global' }); }
    location.reload();
  });

  /* ---------------- expiración de sesión por inactividad (30 min) ---------------- */
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
  let idleTimer = null;
  let lastActivityAt = Date.now();

  function resetIdleTimer(){
    if(!entered) return;
    lastActivityAt = Date.now();
    if(idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(handleIdleTimeout, IDLE_TIMEOUT_MS);
  }

  async function handleIdleTimeout(){
    if(!entered) return;
    if(sb){ await sb.auth.signOut(); }
    location.reload();
  }

  ['click','touchstart','keydown','mousemove','scroll'].forEach(function(evt){
    document.addEventListener(evt, resetIdleTimer, { passive: true });
  });

  // Si el celu quedó en segundo plano (pantalla apagada, otra app abierta)
  // el temporizador puede pausarse. Al volver a primer plano, chequeamos
  // el tiempo real transcurrido en vez de confiar ciegamente en el timer.
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState !== 'visible' || !entered) return;
    if(Date.now() - lastActivityAt >= IDLE_TIMEOUT_MS){
      handleIdleTimeout();
    }else{
      resetIdleTimer();
    }
  });

  /* ---------------- menú desplegable / vistas ---------------- */
  const moreBtn = document.getElementById('moreBtn');
  const menuDropdown = document.getElementById('menuDropdown');
  const globalBackBtn = document.getElementById('globalBackBtn');
  let currentView = 'dashboard';
  let previousView = 'dashboard';
  let ignoreNextPopstate = false;

  function updateBackButton(){
    if(!globalBackBtn) return;
    globalBackBtn.hidden = currentView === 'dashboard';
    const appHeader = document.querySelector('header');
    if(appHeader) appHeader.classList.toggle('has-back-button', currentView !== 'dashboard');
    globalBackBtn.setAttribute('aria-label', 'Volver a ' + ((previousView === 'clients') ? 'Clientes' : (previousView === 'sales') ? 'Ventas' : (previousView === 'settings') ? 'Más' : 'Inicio'));
  }

  function goBackInApp(){
    if(currentView === 'clients' && activeClientDetailName){
      activeClientDetailName = ''; renderClientDetails(''); return;
    }
    if(currentView === 'settings') {
      const settingsMenu = document.getElementById('settingsMenu');
      if(settingsMenu && settingsMenu.style.display === 'none'){ showSettingsMenu(); return; }
    }
    // Si hay una vista interna en el historial, usar la misma pila que el
    // botón Atrás del teléfono. En Inicio, quedarse dentro de la aplicación.
    if(entered && currentView !== 'dashboard' && window.history.state && window.history.state.feritAppView === currentView){
      window.history.back();
      return;
    }
    const destination = previousView && previousView !== currentView ? previousView : 'dashboard';
    switchView(destination, false);
  }
  if(globalBackBtn) globalBackBtn.addEventListener('click', goBackInApp);
  window.addEventListener('popstate', function(event){
    if(!entered) return;
    const target = event.state && event.state.feritAppView;
    if(target){
      switchView(target, false);
    }else{
      // En Inicio no dejamos que Atrás salga accidentalmente de la app.
      try { window.history.pushState({feritAppView:'dashboard'}, '', window.location.pathname); } catch(e) {}
      switchView('dashboard', false);
    }
  });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && !document.getElementById('sheet').classList.contains('open')) goBackInApp(); });

  // Abre el desplegable anclado al botón "Más" del menú inferior,
  // calculando si conviene abrirlo hacia abajo o hacia arriba según
  // el espacio disponible en pantalla.
  function openMenuFrom(anchorEl){
    menuDropdown.style.visibility = 'hidden';
    menuDropdown.style.display = 'block';
    let ddHeight = menuDropdown.offsetHeight;
    menuDropdown.style.visibility = '';

    let rect = anchorEl.getBoundingClientRect();
    let spaceBelow = window.innerHeight - rect.bottom;
    let top = (spaceBelow >= ddHeight + 12) ? (rect.bottom + 8) : (rect.top - ddHeight - 8);

    menuDropdown.style.top = Math.max(8, top) + 'px';
    menuDropdown.style.right = (window.innerWidth - rect.right) + 'px';
    menuDropdown.style.left = 'auto';
  }

  function toggleMenuFrom(anchorEl){
    if(menuDropdown.style.display === 'block'){
      menuDropdown.style.display = 'none';
      return;
    }
    openMenuFrom(anchorEl);
  }

  function closeMoreMenu(){ menuDropdown.style.display = 'none'; moreBtn.setAttribute('aria-expanded','false'); moreBtn.querySelector('.nav-icon').textContent = '⋯'; }
  const menuCloseBtn = document.getElementById('menuCloseBtn');
  if(menuCloseBtn) menuCloseBtn.addEventListener('click', function(e){ e.stopPropagation(); closeMoreMenu(); });
  moreBtn.addEventListener('click', function(e){
    e.stopPropagation();
    toggleMenuFrom(moreBtn);
    const opened = menuDropdown.style.display === 'block';
    moreBtn.setAttribute('aria-expanded', String(opened));
    moreBtn.querySelector('.nav-icon').textContent = opened ? '×' : '⋯';
  });
  menuDropdown.addEventListener('click', function(e){ e.stopPropagation(); });
  document.addEventListener('click', function(){ closeMoreMenu(); });

  function switchView(view, rememberPrevious){
    if(view === 'clients') view = 'sales'; // Clientes queda integrado en Ventas.
    if(view !== currentView && rememberPrevious !== false){ previousView = currentView; }
    // Mantener el historial dentro de la app para que Atrás del teléfono
    // vuelva a la vista anterior en lugar de abandonar la aplicación.
    if(entered && view !== currentView && rememberPrevious !== false){
      try { window.history.pushState({ feritAppView: view }, '', window.location.pathname); } catch(e) {}
    }
    currentView = view;
    document.querySelector('#appRoot > header')?.classList.toggle('view-dashboard', view === 'dashboard');
    updateBackButton();
    document.getElementById('viewSales').style.display = (view === 'sales') ? 'block' : 'none';
    document.getElementById('viewDashboard').style.display = (view === 'dashboard') ? 'block' : 'none';
    document.getElementById('viewClients').style.display = 'none';
    document.getElementById('viewDeliveries').style.display = (view === 'deliveries') ? 'block' : 'none';
    document.getElementById('viewRanking').style.display = (view === 'ranking') ? 'block' : 'none';
    document.getElementById('viewSettings').style.display = (view === 'settings') ? 'block' : 'none';

    let titles = { dashboard:'Inicio', sales:'Ventas', clients:'Ventas', deliveries:'Entregas', ranking:'Ranking de clientes', settings:'Configuración' };
    document.getElementById('viewHeading').textContent = titles[view] || 'Dashboard';

    document.querySelectorAll('.nav-item[data-view], .sidebar-item[data-view]').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    if(view === 'sales'){ renderManagementList(); }
    if(view === 'deliveries'){ renderDeliveriesView(); }
    if(view === 'ranking'){ rankingVisibleCount = 5; renderTopClients(); }
    if(view === 'settings'){ syncNotifyControls(); showSettingsMenu(); }
  }

  /* V12.56 — swipe horizontal más ágil, con detección temprana de dirección. */
  (function enableMainViewSwipe(){
    const order = ['dashboard','sales','deliveries'];
    const surfaces = [document.getElementById('viewDashboard'), document.getElementById('viewSales'), document.getElementById('viewDeliveries')].filter(Boolean);
    let sx=0, sy=0, started=false, horizontal=false, startAt=0, lastSwipeAt=0;
    const ignored = 'input,textarea,select,button,a,[contenteditable="true"],.item-row,.sales-client-group-trigger,.delivery-client-card,[data-no-swipe]';
    surfaces.forEach(function(surface){
      surface.addEventListener('touchstart', function(e){
        if(!entered || !e.touches || e.touches.length!==1 || document.getElementById('sheet').classList.contains('open') || menuDropdown.style.display==='block') { started=false; return; }
        if(e.target.closest(ignored)) { started=false; return; }
        const t=e.touches[0]; sx=t.clientX; sy=t.clientY; startAt=performance.now(); started=true; horizontal=false;
      }, {passive:true});
      surface.addEventListener('touchmove', function(e){
        if(!started || !e.touches || !e.touches.length) return;
        const t=e.touches[0], dx=t.clientX-sx, dy=t.clientY-sy;
        if(Math.abs(dx)>10 && Math.abs(dx)>Math.abs(dy)*1.25) horizontal=true;
        else if(Math.abs(dy)>12 && Math.abs(dy)>Math.abs(dx)*1.15) started=false;
      }, {passive:true});
      surface.addEventListener('touchend', function(e){
        if(!started || !e.changedTouches || !e.changedTouches.length) return;
        started=false;
        const t=e.changedTouches[0], dx=t.clientX-sx, dy=t.clientY-sy;
        const elapsed=Math.max(1,performance.now()-startAt), velocity=Math.abs(dx)/elapsed;
        if(!horizontal || Math.abs(dx)<48 || Math.abs(dx)<Math.abs(dy)*1.25 || (Math.abs(dx)<75 && velocity<0.42)) return;
        if(performance.now()-lastSwipeAt<320) return;
        const idx=order.indexOf(currentView); if(idx<0) return;
        const next=order[idx+(dx<0?1:-1)]; if(next){ lastSwipeAt=performance.now(); switchView(next); }
      }, {passive:true});
      surface.addEventListener('touchcancel', function(){started=false;horizontal=false;},{passive:true});
    });
  })();

  /* ---------------- Configuración: menú de dos niveles ---------------- */
  const SETTINGS_PANEL_IDS = {
    appearance: 'settingsPanelAppearance',
    profile: 'settingsPanelProfile',
    notifications: 'settingsPanelNotifications',
    week: 'settingsPanelWeek',
    receipt: 'settingsPanelReceipt',
    backup: 'settingsPanelBackup',
    danger: 'settingsPanelDanger'
  };

  function showSettingsMenu(){
    document.getElementById('settingsMenu').style.display = 'block';
    Object.keys(SETTINGS_PANEL_IDS).forEach(function(key){
      document.getElementById(SETTINGS_PANEL_IDS[key]).style.display = 'none';
    });
  }

  function showSettingsPanel(key){
    let panelId = SETTINGS_PANEL_IDS[key];
    if(!panelId) return;
    document.getElementById('settingsMenu').style.display = 'none';
    Object.keys(SETTINGS_PANEL_IDS).forEach(function(k){
      document.getElementById(SETTINGS_PANEL_IDS[k]).style.display = (k === key) ? 'block' : 'none';
    });
  }

  document.querySelectorAll('.settings-menu-item').forEach(function(btn){
    btn.addEventListener('click', function(){
      showSettingsPanel(btn.getAttribute('data-settings'));
    });
  });
  document.querySelectorAll('[data-settings-back]').forEach(function(btn){
    btn.addEventListener('click', showSettingsMenu);
  });

  document.querySelectorAll('[data-view]').forEach(function(btn){
    btn.addEventListener('click', function(){
      switchView(btn.getAttribute('data-view'));
      menuDropdown.style.display = 'none';
    });
  });
  const headerProfileBtn = document.getElementById('headerProfileBtn');
  function openProfile(){ switchView('settings'); showSettingsPanel('profile'); }
  if(headerProfileBtn) headerProfileBtn.addEventListener('click', openProfile);
  const greetingAvatarBtn = document.getElementById('greetingAvatar');
  if(greetingAvatarBtn){
    greetingAvatarBtn.setAttribute('role','button');
    greetingAvatarBtn.setAttribute('tabindex','0');
    greetingAvatarBtn.setAttribute('aria-label','Abrir mi perfil');
    greetingAvatarBtn.addEventListener('click', openProfile);
    greetingAvatarBtn.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openProfile(); } });
  }

  let currentUserEmail = null;

  function enterApp(user){
    if(entered) return;
    entered = true;
    currentUserEmail = user.email;
    document.getElementById('authGate').style.display = 'none';
    document.body.classList.remove('auth-locked');
    document.getElementById('appRoot').style.display = 'block';
    document.getElementById('sessionEmail').textContent = 'Sesión iniciada';
    document.getElementById('profileEmail').textContent = user.email;
    window.history.replaceState({feritAppView:'dashboard'}, document.title, window.location.pathname);
    switchView('dashboard', false);
    resetIdleTimer();
    loadSales();
  }

  function showSetNewPinPrompt(){
    document.getElementById('authGate').style.display = 'flex';
    document.body.classList.add('auth-locked');
    document.getElementById('appRoot').style.display = 'none';
    document.getElementById('gateStep1').style.display = 'none';
    document.getElementById('gateSent').style.display = 'none';
    document.getElementById('gateNewPin').style.display = 'block';
  }

  async function initGate(){
    if(!SUPABASE_READY){
      document.getElementById('authGate').style.display = 'flex';
      document.body.classList.add('auth-locked');
      showGateError('Falta configurar Supabase (URL y clave del proyecto) para poder ingresar.');
      return;
    }
    document.getElementById('authGate').style.display = 'flex';
    document.body.classList.add('auth-locked');

    // Importante: el listener se registra ANTES de consultar la sesión
    // inicial. Si no lo hiciéramos así, podría darse una condición de
    // carrera donde un link de "olvidé mi contraseña" deja una sesión
    // de recuperación válida, y el usuario entraría directo a la app
    // sin llegar a elegir una contraseña nueva (quedando con la vieja,
    // que es justo la que había olvidado).
    let recoveryDetected = false;

    sb.auth.onAuthStateChange(function(event, newSession){
      if(event === 'PASSWORD_RECOVERY'){
        recoveryDetected = true;
        showSetNewPinPrompt();
        return;
      }
      if(event === 'SIGNED_IN' && newSession && newSession.user && !recoveryDetected){
        enterApp(newSession.user);
      }
    });

    try{
      let sessionRes = await sb.auth.getSession();
      if(!recoveryDetected && sessionRes.data && sessionRes.data.session && sessionRes.data.session.user){
        enterApp(sessionRes.data.session.user);
      }
    }catch(e){
      console.error('Error leyendo la sesión de Supabase:', e);
    }
  }

  /* =========================================================
     REGISTRO DE VENTAS (datos persistidos en Supabase)
  ========================================================= */

  let sales = [];
  let categories = [];
  let clients = [];
  let activeClientDetailName = '';
  let pendingReceiptItems = [];
  let pendingReceiptClient = '';
  let pendingReceiptTotal = 0;
  let pendingReceiptForceThankYou = false;
  const PAID_RECEIPT_THANK_YOU = 'Muchas Gracias por tu compra!, espero que lo disfrutes! ❤️';
  let weekStartDay = 1; // 0=domingo .. 6=sábado. Por defecto: lunes.
  let notifyEnabled = true;
  let notifyDaysOverdue = 4;
  let receiptMessage = '¡Gracias por tu compra! Te esperamos pronto de nuevo.';
  let storeName = '';
  let avatarUrl = '';

  function updateAvatarDisplay(){
    let greetingAvatar = document.getElementById('greetingAvatar');
    let profileAvatar = document.getElementById('profileAvatarPreview');
    let summaryAvatar = document.getElementById('dashboardSummaryAvatar');
    let headerAvatar = document.getElementById('headerProfileAvatar');
    let targets = [greetingAvatar, profileAvatar, summaryAvatar, headerAvatar];
    targets.forEach(function(el){
      if(!el) return;
      let src = avatarUrl || 'feritapp-icon.png';
      if(el.tagName === 'IMG'){
        el.src = src;
        el.onerror = function(){ this.onerror=null; this.src='feritapp-icon.png'; };
        return;
      }
      el.replaceChildren();
      let img = document.createElement('img');
      img.alt = 'Foto de perfil'; img.loading = 'lazy'; img.decoding = 'async'; img.src = src;
      img.addEventListener('error', function(){ if(img.src.endsWith('feritapp-icon.png')) return; img.src='feritapp-icon.png'; }, { once:true });
      el.appendChild(img);
    });
  }

  function updateGreeting(){
    let el = document.getElementById('greetingBadge');
    let txt = document.getElementById('greetingText');
    if(!el || !txt) return;
    if(storeName){
      txt.textContent = '¡Hola, ' + storeName + '!';
      el.style.display = 'flex';
    }else{
      el.style.display = 'none';
    }
  }

  async function checkOnboarding(){
    if(storeName && storeName.trim()){
      document.getElementById('onboardingGate').style.display = 'none';
      return;
    }
    document.getElementById('appRoot').style.display = 'none';
    document.getElementById('onboardingGate').style.display = 'flex';
  }

  document.getElementById('onboardingSaveBtn').addEventListener('click', async function(){
    let val = document.getElementById('onboardingStoreName').value.trim();
    let err = document.getElementById('onboardingError');
    err.style.display = 'none';
    if(!val){ err.textContent = 'Ingresá un nombre para tu tienda.'; err.style.display = 'block'; return; }
    try{
      await sb.from('user_settings').upsert({ store_name: val }, { onConflict: 'user_id' });
    }catch(e){
      err.textContent = 'No se pudo guardar, probá de nuevo.'; err.style.display = 'block'; return;
    }
    storeName = val;
    let profileInput = document.getElementById('profileStoreName');
    if(profileInput){ profileInput.value = val; }
    document.getElementById('onboardingGate').style.display = 'none';
    document.getElementById('appRoot').style.display = 'block';
    updateGreeting();
    updateAvatarDisplay();
  });

  function resizeImageFile(file, maxSize){
    return new Promise(function(resolve, reject){
      let reader = new FileReader();
      reader.onload = function(e){
        let img = new Image();
        img.onload = function(){
          let scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          let canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(function(blob){
            blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'));
          }, 'image/jpeg', 0.85);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  document.getElementById('avatarUploadBtn').addEventListener('click', function(){
    document.getElementById('avatarFileInput').click();
  });

  document.getElementById('avatarFileInput').addEventListener('change', async function(e){
    let file = e.target.files[0];
    if(!file) return;
    if(!file.type.startsWith('image/')){ showToast('Elegí un archivo de imagen.'); return; }

    try{
      let blob = await resizeImageFile(file, 300);
      let sessionRes = await sb.auth.getSession();
      let uid = sessionRes.data && sessionRes.data.session ? sessionRes.data.session.user.id : null;
      if(!uid){ showToast('No se pudo identificar tu cuenta.'); return; }

      let path = uid + '/avatar.jpg';
      let upRes = await sb.storage.from('avatars').upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if(upRes.error) throw upRes.error;

      let urlRes = sb.storage.from('avatars').getPublicUrl(path);
      if(!urlRes || !urlRes.data || !urlRes.data.publicUrl){
        throw new Error('No se pudo obtener la URL pública del avatar.');
      }
      let publicUrl = urlRes.data.publicUrl + '?t=' + Date.now(); // evita caché vieja

      let settingsRes = await sb.from('user_settings').upsert({ avatar_url: publicUrl }, { onConflict: 'user_id' });
      if(settingsRes.error) throw settingsRes.error;
      avatarUrl = publicUrl;
      updateAvatarDisplay();
      showToast('Foto de perfil actualizada');
    }catch(err){
      showToast('No se pudo subir la foto. Probá de nuevo.');
    }finally{
      e.target.value = '';
    }
  });

  document.getElementById('saveStoreNameBtn').addEventListener('click', async function(){
    let val = document.getElementById('profileStoreName').value.trim();
    if(!val){ showToast('Ingresá un nombre para tu tienda.'); return; }
    try{
      let storeRes = await sb.from('user_settings').upsert({ store_name: val }, { onConflict: 'user_id' });
      if(storeRes.error) throw storeRes.error;
      storeName = val;
      updateGreeting();
    updateAvatarDisplay();
      showToast('Nombre de la tienda actualizado');
    }catch(e){
      showToast('No se pudo guardar.');
    }
  });
  const sheet = document.getElementById('sheet');
  const scrim = document.getElementById('scrim');
  const CATEGORY_COLORS = ['#446DF6','#08A4BD','#17A897','#B23A52','#8C4A9C','#5FA8A0','#6C8EBF','#C9A15F'];

  function categoryColor(name){
    let str = String(name || '');
    let hash = 0;
    for(let i=0;i<str.length;i++){ hash = (hash * 31 + str.charCodeAt(i)) >>> 0; }
    return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
  }

  function mapRowToSale(row){
    return {
      id: row.id,
      fecha: row.fecha,
      cliente: row.cliente,
      articulo: row.articulo,
      precio: Number(row.precio),
      pagado: row.pagado,
      retira: row.retira,
      tercero: row.tercero || '',
      categoria: row.categoria || 'Sin categoría',
      entregado: !!row.entregado
    };
  }

  function refreshClientsDatalist(){
    let dl = document.getElementById('clientsDatalist');
    if(!dl) return;
    dl.innerHTML = clients.map(function(c){
      return '<option value="' + escapeHtml(c) + '">';
    }).join('');
  }

  async function persistClientIfNew(name){
    let exists = clients.some(function(c){ return c.toLowerCase() === name.toLowerCase(); });
    if(exists) return;
    clients.push(name);
    refreshClientsDatalist();
    try{
      await sb.from('clients').insert([{ name: name }]);
    }catch(e){ /* si falla, igual queda disponible en esta sesión */ }
  }

  async function loadSales(){
    if(!sb) return;
    try{
      let res = await sb.from('sales').select('*').order('fecha', { ascending:false });
      sales = (res.data || []).map(mapRowToSale);
    }catch(e){
      sales = [];
      showToast('No se pudieron cargar las ventas.');
    }

    try{
      let catRes = await sb.from('categories').select('*').order('created_at', { ascending:true });
      categories = (catRes.data || []).map(function(c){ return c.name; });
    }catch(e){
      categories = [];
    }

    if(categories.length === 0){
      let defaults = ["Remeras","Pantalones","Vestidos","Accesorios"];
      for(let i=0;i<defaults.length;i++){
        await persistNewCategory(defaults[i]);
      }
      categories = defaults;
    }

    try{
      let clientsRes = await sb.from('clients').select('*').order('name', { ascending:true });
      clients = (clientsRes.data || []).map(function(c){ return c.name; });
    }catch(e){
      clients = [];
    }
    refreshClientsDatalist();

    let lastPurgeSemester = null;
    try{
      let settingsRes = await sb.from('user_settings').select('week_start_day, last_purge_semester, notify_enabled, notify_days_overdue, receipt_message, store_name, avatar_url').maybeSingle();
      if(settingsRes.data){
        weekStartDay = settingsRes.data.week_start_day;
        lastPurgeSemester = settingsRes.data.last_purge_semester;
        notifyEnabled = settingsRes.data.notify_enabled !== false;
        notifyDaysOverdue = settingsRes.data.notify_days_overdue || 4;
        if(settingsRes.data.receipt_message){ receiptMessage = settingsRes.data.receipt_message; }
        storeName = settingsRes.data.store_name || '';
        avatarUrl = settingsRes.data.avatar_url || '';
      }else{
        await sb.from('user_settings').insert([{}]); // usa los valores por defecto (lunes)
        weekStartDay = 1;
      }
    }catch(e){
      weekStartDay = 1;
    }
    let weekStartSelect = document.getElementById('weekStartSelect');
    if(weekStartSelect){ weekStartSelect.value = String(weekStartDay); }
    let receiptMessageInput = document.getElementById('receiptMessageInput');
    if(receiptMessageInput){ receiptMessageInput.value = receiptMessage; }
    let profileStoreNameInput = document.getElementById('profileStoreName');
    if(profileStoreNameInput){ profileStoreNameInput.value = storeName; }
    updateGreeting();
    updateAvatarDisplay();
    await checkOnboarding();
    syncNotifyControls();

    await checkSemesterCleanup(lastPurgeSemester);
    checkOverdueNotifications();

    render();
    resetForm();
  }

  function csvEscape(val){
    val = String(val === null || val === undefined ? '' : val);
    // Protección contra "inyección de fórmulas": si el valor empieza con
    // un carácter que Excel/Sheets interpreta como inicio de fórmula,
    // le antepongo un apóstrofe para que se trate siempre como texto.
    if(/^[=+\-@\t\r]/.test(val)){
      val = "'" + val;
    }
    if(/[",\n;]/.test(val)){
      val = '"' + val.replace(/"/g, '""') + '"';
    }
    return val;
  }

  function exportSalesToCSV(items, filename){
    if(!items || items.length === 0) return false;

    let headers = ['Fecha','Cliente','Artículo','Categoría','Precio','Pagado','Retira','Tercero'];
    let lines = [headers.map(csvEscape).join(',')];

    items.slice().sort(function(a,b){ return new Date(a.fecha) - new Date(b.fecha); }).forEach(function(s){
      let fechaTxt = new Date(s.fecha).toLocaleDateString('es-AR') + ' ' + new Date(s.fecha).toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'});
      let retiraTxt = s.retira === 'otro' ? 'Otra persona' : 'El mismo cliente';
      let row = [fechaTxt, s.cliente, s.articulo, s.categoria, s.precio, s.pagado ? 'Sí' : 'No', retiraTxt, s.tercero || ''];
      lines.push(row.map(csvEscape).join(','));
    });

    // \uFEFF (BOM) al principio para que Excel abra los acentos bien.
    let csvContent = '\uFEFF' + lines.join('\r\n');
    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let url = URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    return true;
  }

  // ---------------- comprobante compartible (imagen, sin links) ----------------
  function wrapCanvasText(ctx, text, maxWidth){
    let words = text.split(' ');
    let lines = [];
    let current = '';
    words.forEach(function(w){
      let test = current ? current + ' ' + w : w;
      if(ctx.measureText(test).width > maxWidth && current){
        lines.push(current);
        current = w;
      }else{
        current = test;
      }
    });
    if(current) lines.push(current);
    return lines;
  }

  function truncateCanvasText(ctx, text, maxWidth){
    if(ctx.measureText(text).width <= maxWidth) return text;
    let truncated = text;
    while(truncated.length > 1 && ctx.measureText(truncated + '…').width > maxWidth){
      truncated = truncated.slice(0, -1);
    }
    return truncated + '…';
  }

  function drawDashedLine(ctx, x1, y, x2){
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let x = x1;
    while(x < x2){
      ctx.moveTo(x, y);
      ctx.lineTo(Math.min(x + 6, x2), y);
      x += 12;
    }
    ctx.stroke();
  }

  async function generateReceiptCanvas(compradorNombre, items, mensaje){
    // V12: el archivo compartido no expone nombres ni usuarios de las partes.
    const W = 600, PADDING = 40, LINE_H = 34;
    const NAVY = '#17164A', GRAY = '#727A98', ACCENT = '#6547F5', PALE = '#F1EEFF', LINE = '#E4E0FA';

    // Uso un canvas temporal solo para medir el texto del mensaje y
    // saber cuántas líneas ocupa, antes de fijar la altura final.
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    const messageFontSize = Math.max(10, Math.min(16, Number(document.getElementById('receiptMessageFontSize')?.value) || 12));
    measureCtx.font = 'italic ' + messageFontSize + 'px Arial';
    const messageLines = mensaje ? wrapCanvasText(measureCtx, mensaje, W - PADDING * 2) : [];

    const headerH = 142;
    const itemsH = items.length * LINE_H;
    const footerH = messageLines.length ? (30 + messageLines.length * 19) : 20;
    const H = headerH + 60 + itemsH + 70 + footerH;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    // Cargar el logo real antes de dibujar para que quede incluido en el PNG exportado.
    const receiptLogo = await new Promise(function(resolve){
      const img = new Image();
      img.onload = function(){ resolve(img); };
      img.onerror = function(){ resolve(null); };
      img.src = 'feritapp-receipt-logo.png';
    });

    ctx.fillStyle = '#F8F7FF';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(18, 18, W - 36, H - 36);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(18, 18, W - 36, 8);
    ctx.fillStyle = PALE;
    ctx.fillRect(18, 26, W - 36, 92);
    // Logo FeritApp grande en el margen superior derecho, sin nombre de tienda en el pie.
    if(receiptLogo) ctx.drawImage(receiptLogo, W - PADDING - 110, 24, 110, 110);

    let y = 62;
    ctx.textAlign = 'left';
    ctx.fillStyle = ACCENT;
    ctx.font = 'bold 27px Arial';
    const receiptStoreName = (storeName || document.getElementById('profileStoreName')?.value || '').trim() || 'Mi tienda';
    const receiptAvatar = await new Promise(function(resolve){ const img=new Image(); img.crossOrigin='anonymous'; img.onload=function(){resolve(img);}; img.onerror=function(){resolve(null);}; img.src=avatarUrl || 'feritapp-icon.png'; });
    if(receiptAvatar){ ctx.save(); ctx.beginPath(); ctx.arc(PADDING+17,55,17,0,Math.PI*2); ctx.clip(); ctx.drawImage(receiptAvatar,PADDING,38,34,34); ctx.restore(); }
    const nameX = PADDING + 44;
    ctx.fillText(truncateCanvasText(ctx, receiptStoreName, W - nameX - PADDING - 122), nameX, y);
    y += 29;
    ctx.font = 'bold 15px Arial';
    ctx.fillStyle = NAVY;
    ctx.fillText('COMPROBANTE DE COMPRA', PADDING, y);
    y += 22;
    ctx.font = '12px Arial';
    ctx.fillStyle = GRAY;
    ctx.fillText(new Date().toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' }), PADDING, y);

    y = 151;
    ctx.fillStyle = GRAY;
    ctx.font = 'bold 12px Arial';
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = GRAY;
    ctx.fillText('ARTÍCULO', PADDING, y);
    ctx.textAlign = 'right';
    ctx.fillText('PRECIO', W - PADDING, y);
    y += 22;
    ctx.font = '15px Arial';
    let total = 0;
    items.forEach(function(it){
      ctx.textAlign = 'left';
      ctx.fillStyle = NAVY;
      ctx.fillText(truncateCanvasText(ctx, it.articulo, 330), PADDING, y);
      ctx.textAlign = 'right';
      let priceTxt = money(it.precio);
      ctx.fillText(priceTxt, W - PADDING, y);
      total += Number(it.precio) || 0;
      y += LINE_H;
      ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(PADDING, y - 13); ctx.lineTo(W - PADDING, y - 13); ctx.stroke();
    });

    y += 6;
    ctx.fillStyle = PALE; ctx.fillRect(PADDING - 8, y - 15, W - PADDING * 2 + 16, 52);
    y += 18;

    ctx.textAlign = 'left';
    ctx.font = 'bold 19px Arial';
    ctx.fillStyle = NAVY;
    ctx.fillText('Total', PADDING, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = ACCENT;
    ctx.fillText(money(total), W - PADDING, y);

    if(messageLines.length){
      y += 40;
      ctx.textAlign = 'left';
      ctx.font = 'italic ' + messageFontSize + 'px Arial';
      ctx.fillStyle = GRAY;
      messageLines.forEach(function(line){
        ctx.fillText(line, PADDING, y);
        y += 19;
      });
    }

    // Pie limpio: sin repetir el nombre de la tienda ni el logo.
    const footerY = H - 24;
    ctx.strokeStyle = LINE; ctx.beginPath(); ctx.moveTo(PADDING, footerY - 10); ctx.lineTo(W - PADDING, footerY - 10); ctx.stroke();
    return canvas;
  }

  function shareReceipt(compradorNombre, items){
    if(!items || items.length === 0){ showToast('No hay artículos para compartir.'); return; }
    const clientName = (compradorNombre || '').trim();
    const currentKey = weekKey(new Date());
    const previousKey = previousWeekKey();
    // El comprobante nunca incluye ventas anteriores a estas dos semanas.
    const eligibleItems = sales.filter(function(item){
      return (item.cliente || '').trim() === clientName && item.fecha &&
        (weekKey(new Date(item.fecha)) === currentKey || weekKey(new Date(item.fecha)) === previousKey);
    }).sort(function(a,b){ return new Date(a.fecha)-new Date(b.fecha); });
    if(!eligibleItems.length){ showToast('Este cliente no tiene artículos de la semana actual ni de la semana anterior.'); return; }
    pendingReceiptItems = eligibleItems;
    pendingReceiptClient = clientName;
    pendingReceiptTotal = eligibleItems.reduce(function(sum, item){ return sum + (Number(item.precio)||0); }, 0);
    // Si queda algún importe pendiente en las dos semanas incluidas, se conserva el mensaje configurable.
    // Si todo está abonado, el comprobante lleva el agradecimiento fijo solo para este envío.
    pendingReceiptForceThankYou = eligibleItems.every(function(item){ return !!item.pagado; });
    let scrim = document.getElementById('receiptEditScrim');
    let msg = document.getElementById('receiptShareMessage');
    msg.value = pendingReceiptForceThankYou ? PAID_RECEIPT_THANK_YOU : (receiptMessage || '');
    msg.readOnly = pendingReceiptForceThankYou;
    msg.setAttribute('aria-readonly', String(pendingReceiptForceThankYou));
    document.getElementById('receiptPreviewDate').textContent = new Date().toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' });
    let previewStoreName = document.getElementById('receiptPreviewStoreName');
    if(previewStoreName) previewStoreName.textContent = (storeName || document.getElementById('profileStoreName')?.value || '').trim() || 'Mi tienda';
    const receiptAvatar=document.getElementById('receiptPreviewAvatar'); if(receiptAvatar) receiptAvatar.src=avatarUrl || 'feritapp-icon.png';
    document.getElementById('receiptPreviewItems').innerHTML = eligibleItems.map(function(item){
      return '<div class="receipt-preview-item"><span>' + escapeHtml(item.articulo || 'Artículo') + '</span><strong>' + money(item.precio) + '</strong></div>';
    }).join('');
    document.getElementById('receiptPreviewTotal').textContent = money(pendingReceiptTotal);
    const receiptFooterName = document.getElementById('receiptPreviewFooterName');
    if(receiptFooterName) receiptFooterName.textContent = (storeName || document.getElementById('profileStoreName')?.value || '').trim() || 'Mi tienda';
    updateReceiptPreviewMessage();
    scrim.hidden = false;
    document.body.classList.add('receipt-modal-open');
    msg.focus();
  }

  function updateReceiptPreviewMessage(){
    let msg = document.getElementById('receiptShareMessage');
    let preview = document.getElementById('receiptPreviewMessage');
    const slider=document.getElementById('receiptMessageFontSize'); const output=document.getElementById('receiptMessageFontSizeValue');
    const size=Math.max(10,Math.min(16,Number(slider&&slider.value)||12));
    if(preview){ preview.textContent = msg && msg.value.trim() ? msg.value.trim() : ' '; preview.style.fontSize=size+'px'; }
    if(output) output.textContent=size+' px';
  }

  async function performReceiptShare(){
    if(!pendingReceiptItems.length) return;
    let msg = document.getElementById('receiptShareMessage').value.trim();
    const forceThankYou = pendingReceiptForceThankYou;
    // El mensaje de agradecimiento para abonados es puntual y no pisa la preferencia personalizada.
    if(!forceThankYou){
      receiptMessage = msg;
      try{
        let saveRes = await sb.from('user_settings').upsert({ receipt_message: msg }, { onConflict: 'user_id' });
        if(saveRes.error) console.warn('No se pudo guardar la preferencia del mensaje del comprobante.');
      }catch(e){ /* compartir no debe depender de que se guarde la preferencia */ }
    }
    closeReceiptEditor();
    let canvas = await generateReceiptCanvas('', pendingReceiptItems, msg);
    canvas.toBlob(async function(blob){
      if(!blob){ showToast('No se pudo generar el comprobante.'); return; }
      // El nombre del archivo también evita datos personales.
      let file = new File([blob], 'comprobante-de-venta.png', { type: 'image/png' });
      if(navigator.canShare && navigator.canShare({ files: [file] })){
        try{
          await navigator.share({ files: [file], text: msg || undefined });
          return;
        }catch(e){ if(e && e.name === 'AbortError') return; }
      }
      let url = URL.createObjectURL(blob);
      let a = document.createElement('a');
      a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
      showToast('Comprobante descargado. Podés adjuntarlo desde Messenger.');
    }, 'image/png');
  }

  function closeReceiptEditor(){
    let scrim = document.getElementById('receiptEditScrim');
    if(scrim) scrim.hidden = true;
    document.body.classList.remove('receipt-modal-open');
  }
  document.getElementById('receiptShareMessage').addEventListener('input', updateReceiptPreviewMessage);
  document.getElementById('receiptMessageFontSize').addEventListener('input', updateReceiptPreviewMessage);
  document.getElementById('confirmReceiptShare').addEventListener('click', performReceiptShare);
  document.getElementById('closeReceiptEdit').addEventListener('click', closeReceiptEditor);
  document.getElementById('cancelReceiptShare').addEventListener('click', closeReceiptEditor);
  document.getElementById('receiptEditScrim').addEventListener('click', function(e){ if(e.target === this) closeReceiptEditor(); });

  let saveReceiptMessageBtnEl = document.getElementById('saveReceiptMessageBtn');
  if(saveReceiptMessageBtnEl){
    saveReceiptMessageBtnEl.addEventListener('click', async function(){
      let val = document.getElementById('receiptMessageInput').value.trim();
      receiptMessage = val;
      try{
        await sb.from('user_settings').upsert({ receipt_message: val }, { onConflict: 'user_id' });
        showToast('Mensaje guardado');
      }catch(e){
        showToast('No se pudo guardar el mensaje.');
      }
    });
  }

  // Cada semestre (ene-jun / jul-dic), borra las ventas anteriores al
  // mes en curso, dejando solo el mes actual. Se controla con
  // last_purge_semester en user_settings para que corra como mucho
  // una vez por semestre, no en cada inicio de sesión. Recibe el valor
  // ya cargado por loadSales() para no volver a consultar la misma fila.
  async function checkSemesterCleanup(stored){
    let now = new Date();
    let currentSemester = now.getFullYear() + '-' + (now.getMonth() < 6 ? 'H1' : 'H2');

    try{
      if(stored && stored !== currentSemester){
        let startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        let oldItems = sales.filter(function(s){ return new Date(s.fecha) < startOfMonth; });

        if(oldItems.length > 0){
          exportSalesToCSV(oldItems, 'feritapp-historial-' + stored + '.csv');
        }

        await sb.from('sales').delete().lt('fecha', startOfMonth.toISOString());
        sales = sales.filter(function(s){ return new Date(s.fecha) >= startOfMonth; });
        showToast('Mantenimiento semestral: se descargó un CSV de respaldo y se limpió el historial anterior.', 5000);
      }

      await sb.from('user_settings').upsert({ last_purge_semester: currentSemester }, { onConflict: 'user_id' });
    }catch(e){
      // Si falla, no es crítico: se vuelve a intentar en el próximo login.
    }
  }

  /* ---------------- Configuración › Notificaciones ---------------- */
  function syncNotifyControls(){
    document.querySelectorAll('.notify-opt').forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-notify') === (notifyEnabled ? 'on' : 'off'));
    });
    let daysField = document.getElementById('notifyDaysField');
    if(daysField){ daysField.style.display = notifyEnabled ? 'block' : 'none'; }
    let daysSelect = document.getElementById('notifyDaysSelect');
    if(daysSelect){ daysSelect.value = String(notifyDaysOverdue); }
    updateNotifPermStatus();
  }

  function updateNotifPermStatus(){
    let el = document.getElementById('notifPermStatus');
    if(!el) return;
    if(!('Notification' in window)){
      el.textContent = 'Tu navegador no soporta notificaciones.';
    }else if(Notification.permission === 'granted'){
      el.textContent = '✅ Permiso concedido — vas a recibir avisos al abrir la app.';
    }else if(Notification.permission === 'denied'){
      el.textContent = '🚫 Bloqueaste las notificaciones desde la configuración del navegador. Para reactivarlas, tenés que habilitarlas ahí manualmente.';
    }else{
      el.textContent = 'Tu navegador te va a pedir permiso una sola vez.';
    }
  }

  document.querySelectorAll('.notify-opt').forEach(function(btn){
    btn.addEventListener('click', async function(){
      notifyEnabled = btn.getAttribute('data-notify') === 'on';
      syncNotifyControls();
      try{ await sb.from('user_settings').upsert({ notify_enabled: notifyEnabled }, { onConflict: 'user_id' }); }catch(e){}
      if(notifyEnabled){ checkOverdueNotifications(); }
    });
  });

  let notifyDaysSelectEl = document.getElementById('notifyDaysSelect');
  if(notifyDaysSelectEl){
    notifyDaysSelectEl.addEventListener('change', async function(){
      notifyDaysOverdue = parseInt(this.value, 10);
      try{ await sb.from('user_settings').upsert({ notify_days_overdue: notifyDaysOverdue }, { onConflict: 'user_id' }); }catch(e){}
      checkOverdueNotifications();
    });
  }

  let enableNotifPermBtn = document.getElementById('enableNotifPermBtn');
  if(enableNotifPermBtn){
    enableNotifPermBtn.addEventListener('click', async function(){
      if(!('Notification' in window)){ showToast('Tu navegador no soporta notificaciones.'); return; }
      await Notification.requestPermission();
      updateNotifPermStatus();
      if(Notification.permission === 'granted'){ checkOverdueNotifications(); }
    });
  }

  // Revisa pagos pendientes atrasados según lo configurado y muestra una
  // notificación por cada uno (vía el service worker ya registrado).
  // Importante: esto NO es un push real desde un servidor — solo se
  // dispara mientras la app está abierta, no si está cerrada del todo.
  let notifiedIds = {};
  async function checkOverdueNotifications(){
    if(!notifyEnabled) return;
    if(!('Notification' in window) || Notification.permission !== 'granted') return;
    if(!('serviceWorker' in navigator)) return;

    let thresholdMs = notifyDaysOverdue * 24 * 60 * 60 * 1000;
    let now = Date.now();
    let overdue = sales.filter(function(s){
      return !s.pagado && (now - new Date(s.fecha).getTime()) >= thresholdMs && !notifiedIds[s.id];
    });
    if(overdue.length === 0) return;

    try{
      let reg = await navigator.serviceWorker.ready;
      overdue.slice(0, 8).forEach(function(s){
        reg.showNotification('Pago atrasado', {
          body: s.cliente + ' — ' + s.articulo + ' — ' + money(s.precio),
          icon: 'icon-192.png',
          tag: 'overdue-' + s.id
        });
        notifiedIds[s.id] = true;
      });
    }catch(e){ /* no crítico */ }
  }

  document.getElementById('weekStartSelect').addEventListener('change', async function(){
    let val = parseInt(this.value, 10);
    weekStartDay = val;
    try{
      await sb.from('user_settings').upsert({ week_start_day: val }, { onConflict: 'user_id' });
      showToast('Configuración guardada');
    }catch(e){
      showToast('No se pudo guardar la configuración.');
    }
    render();
  });

  async function persistNewCategory(name){
    try{
      await sb.from('categories').insert([{ name: name }]);
    }catch(e){
      showToast('No se pudo guardar la categoría.');
    }
  }

  async function toggleSalePago(id, currentPagado){
    try{
      await sb.from('sales').update({ pagado: !currentPagado }).eq('id', id);
      let item = sales.find(function(s){ return s.id === id; });
      if(item){ item.pagado = !currentPagado; }
      render();
    }catch(e){
      showToast('No se pudo actualizar el estado de pago.');
    }
  }

  function confirmDeleteClientSales(clientName, count){
    return new Promise(function(resolve){
      let overlay=document.getElementById('saleGroupDeleteDialog');
      if(!overlay){
        overlay=document.createElement('div'); overlay.id='saleGroupDeleteDialog'; overlay.className='fa-dialog-backdrop'; overlay.hidden=true;
        overlay.innerHTML='<section class="fa-dialog" role="dialog" aria-modal="true" aria-labelledby="saleDeleteTitle" aria-describedby="saleDeleteDescription"><div class="fa-dialog-icon" aria-hidden="true">✕</div><h2 id="saleDeleteTitle">Eliminar ventas</h2><p id="saleDeleteDescription"></p><div class="fa-dialog-actions"><button type="button" class="fa-dialog-cancel">Cancelar</button><button type="button" class="fa-dialog-confirm">Eliminar ventas</button></div></section>';
        document.body.appendChild(overlay);
      }
      overlay.querySelector('#saleDeleteTitle').textContent='Eliminar ventas';
      overlay.querySelector('.fa-dialog-confirm').textContent='Eliminar ventas';
      overlay.querySelector('#saleDeleteDescription').textContent='¿Querés eliminar las '+count+' '+(count===1?'venta':'ventas')+' de '+clientName+'? Esta acción no se puede deshacer.';
      const cancel=overlay.querySelector('.fa-dialog-cancel'), confirm=overlay.querySelector('.fa-dialog-confirm');
      const onCancel=function(){finish(false);}, onConfirm=function(){finish(true);}, onBackdrop=function(event){if(event.target===overlay)finish(false);}, onKeydown=function(event){if(event.key==='Escape'){event.preventDefault();finish(false);}};
      let finished=false;
      function finish(value){if(finished)return;finished=true;overlay.hidden=true;document.body.classList.remove('fa-dialog-open');cancel.removeEventListener('click',onCancel);confirm.removeEventListener('click',onConfirm);overlay.removeEventListener('click',onBackdrop);document.removeEventListener('keydown',onKeydown);resolve(value);}
      overlay.hidden=false;document.body.classList.add('fa-dialog-open');cancel.addEventListener('click',onCancel);confirm.addEventListener('click',onConfirm);overlay.addEventListener('click',onBackdrop);document.addEventListener('keydown',onKeydown);window.requestAnimationFrame(function(){cancel.focus();});
    });
  }

  const DELETE_UNDO_WINDOW_MS = 10000;
  let pendingUndoOperations = [];

  function refreshUndoToast(){
    const toast=document.getElementById('toast');
    if(!toast)return;
    const latest=pendingUndoOperations[pendingUndoOperations.length-1];
    if(!latest){toast.classList.remove('has-action');return;}
    toast.replaceChildren(document.createTextNode(latest.message+' '));
    const undo=document.createElement('button');
    undo.type='button'; undo.className='toast-undo'; undo.textContent='Deshacer';
    undo.setAttribute('aria-label','Deshacer eliminación');
    undo.addEventListener('click',function(){undoPendingDeletion(latest.id);});
    toast.appendChild(undo); toast.classList.add('show','has-action');
  }

  function scheduleUndoableDeletion(options){
    const op={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),message:options.message,undo:options.undo,commit:options.commit,timer:null};
    pendingUndoOperations.push(op);
    op.timer=setTimeout(async function(){
      pendingUndoOperations=pendingUndoOperations.filter(function(item){return item.id!==op.id;});
      try{await op.commit();}
      catch(error){
        try{op.undo();render();}catch(restoreError){}
        showToast('No se pudo completar la eliminación. Se restauró la información en pantalla; verificá la conexión.');
      }
      if(pendingUndoOperations.length)refreshUndoToast();
      else{const toast=document.getElementById('toast');if(toast)toast.classList.remove('has-action','show');}
    },DELETE_UNDO_WINDOW_MS);
    refreshUndoToast();
    return op.id;
  }

  function undoPendingDeletion(id){
    const index=pendingUndoOperations.findIndex(function(item){return item.id===id;});
    if(index<0)return;
    const op=pendingUndoOperations[index];
    clearTimeout(op.timer);
    pendingUndoOperations.splice(index,1);
    try{op.undo();}catch(error){showToast('No se pudo restaurar la vista. Actualizá la pantalla para verificar.');}
    render();
    if(pendingUndoOperations.length)refreshUndoToast();
    else showToast('Eliminación deshecha');
  }

  async function deleteSalesGroup(ids){
    const uniqueIds=Array.from(new Set(ids.map(String)));
    if(!uniqueIds.length)return;
    const removed=sales.filter(function(item){return uniqueIds.includes(String(item.id));});
    if(!removed.length){showToast('No se encontraron ventas para eliminar.');return;}
    sales=sales.filter(function(item){return !uniqueIds.includes(String(item.id));});
    render();
    scheduleUndoableDeletion({
      message:(removed.length===1?'Venta eliminada.':'Ventas eliminadas: '+removed.length+'.')+' Podés deshacer',
      undo:function(){sales=sales.concat(removed);},
      commit:async function(){
        const result=await sb.from('sales').delete().in('id',uniqueIds).select('id');
        if(result.error)throw result.error;
        const deletedIds=new Set((result.data||[]).map(function(item){return String(item.id);}));
        if(!deletedIds.size)throw new Error('No se eliminó ninguna venta.');
      }
    });
  }

  function confirmDeleteSale(item){
    return new Promise(function(resolve){
      let overlay = document.getElementById('saleDeleteDialog');
      if(!overlay){
        overlay = document.createElement('div');
        overlay.id = 'saleDeleteDialog';
        overlay.className = 'fa-dialog-backdrop';
        overlay.hidden = true;
        overlay.innerHTML = '<section class="fa-dialog" role="dialog" aria-modal="true" aria-labelledby="saleDeleteTitle" aria-describedby="saleDeleteDescription"><div class="fa-dialog-icon" aria-hidden="true">✕</div><h2 id="saleDeleteTitle">Eliminar venta</h2><p id="saleDeleteDescription"></p><div class="fa-dialog-actions"><button type="button" class="fa-dialog-cancel">Cancelar</button><button type="button" class="fa-dialog-confirm">Eliminar venta</button></div></section>';
        document.body.appendChild(overlay);
      }
      const description = overlay.querySelector('#saleDeleteDescription');
      const cancel = overlay.querySelector('.fa-dialog-cancel');
      const confirm = overlay.querySelector('.fa-dialog-confirm');
      const dialog = overlay.querySelector('.fa-dialog');
      description.textContent = '¿Querés eliminar “' + (item.articulo || 'este artículo') + '” de ' + (item.cliente || 'este cliente') + '? Esta acción no se puede deshacer.';
      overlay.hidden = false;
      document.body.classList.add('fa-dialog-open');
      let finished = false;
      function finish(value){
        if(finished) return;
        finished = true;
        overlay.hidden = true;
        document.body.classList.remove('fa-dialog-open');
        cancel.removeEventListener('click', onCancel);
        confirm.removeEventListener('click', onConfirm);
        overlay.removeEventListener('click', onBackdrop);
        document.removeEventListener('keydown', onKeydown);
        resolve(value);
      }
      function onCancel(){finish(false);}
      function onConfirm(){finish(true);}
      function onBackdrop(event){if(event.target === overlay) finish(false);}
      function onKeydown(event){if(event.key === 'Escape'){event.preventDefault();finish(false);}}
      cancel.addEventListener('click', onCancel);
      confirm.addEventListener('click', onConfirm);
      overlay.addEventListener('click', onBackdrop);
      document.addEventListener('keydown', onKeydown);
      window.requestAnimationFrame(function(){confirm.focus();});
    });
  }

  async function deleteSale(id){
    const removed=sales.filter(function(item){return String(item.id)===String(id);});
    if(!removed.length){showToast('No se encontró la venta para eliminar.');return;}
    sales=sales.filter(function(item){return String(item.id)!==String(id);});
    render();
    scheduleUndoableDeletion({
      message:'Venta eliminada. Podés deshacer',
      undo:function(){sales=sales.concat(removed);},
      commit:async function(){
        const result=await sb.from('sales').delete().eq('id',id).select('id');
        if(result.error)throw result.error;
        if(!result.data||result.data.length===0)throw new Error('La venta no se eliminó.');
      }
    });
  }

  /* ---------------- date / week helpers ---------------- */
  function startOfWeek(d){
    let date = new Date(d);
    let day = date.getDay(); // 0 sun .. 6 sat
    let diff = (day - weekStartDay + 7) % 7; // días desde el inicio de semana elegido
    date.setDate(date.getDate() - diff);
    date.setHours(0,0,0,0);
    return date;
  }
  function weekKey(d){
    let s = startOfWeek(d);
    return s.getFullYear() + "-" + String(s.getMonth()+1).padStart(2,'0') + "-" + String(s.getDate()).padStart(2,'0');
  }
  function previousWeekKey(referenceDate){
    const previousStart = startOfWeek(referenceDate || new Date());
    previousStart.setDate(previousStart.getDate() - 7);
    return weekKey(previousStart);
  }
  // Única regla para seleccionar ventas de una semana en todas las vistas.
  function salesForWeek(items, key){
    return (items || []).filter(function(item){
      if(!item || !item.fecha) return false;
      const date = new Date(item.fecha);
      return !Number.isNaN(date.getTime()) && weekKey(date) === key;
    });
  }
  const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const MESES_LARGO = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  function formatRange(weekStartKey){
    let start = new Date(weekStartKey + "T00:00:00");
    let end = new Date(start); end.setDate(end.getDate()+6);
    return start.getDate() + " " + MESES[start.getMonth()] + " – " + end.getDate() + " " + MESES[end.getMonth()];
  }
  function money(n){
    return "$" + Number(n||0).toLocaleString('es-AR');
  }
  function monthKey(d){
    let date = new Date(d);
    return date.getFullYear() + "-" + String(date.getMonth()+1).padStart(2,'0');
  }
  function monthLabel(key){
    let parts = key.split("-");
    let y = parts[0], m = parseInt(parts[1],10) - 1;
    return MESES_LARGO[m] + " " + y;
  }

  /* ---------------- rendering ---------------- */
  function groupByWeek(){
    let groups = {};
    sales.forEach(function(s){
      let k = weekKey(new Date(s.fecha));
      if(!groups[k]) groups[k] = [];
      groups[k].push(s);
    });
    return groups;
  }

  function groupByMonth(){
    let groups = {};
    sales.forEach(function(s){
      let k = monthKey(s.fecha);
      if(!groups[k]) groups[k] = [];
      groups[k].push(s);
    });
    return groups;
  }

  let compareMonthA = null, compareMonthB = null;
  let compareWeekA = null, compareWeekB = null;
  let comparePeriodMode = 'week';

  function renderPeriodComparison(){
    if(comparePeriodMode === 'week'){ renderWeekComparison(); }
    else{ renderMonthComparison(); }
  }

  document.querySelectorAll('.period-opt').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.period-opt').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      comparePeriodMode = btn.getAttribute('data-period');
      renderPeriodComparison();
    });
  });

  function deltaHtml(a, b){
    if(!b){
      if(!a) return '<span class="delta flat">—</span>';
      return '<span class="delta up">▲ nuevo</span>';
    }
    let pct = Math.round(((a - b) / b) * 100);
    if(pct === 0) return '<span class="delta flat">0%</span>';
    let cls = pct > 0 ? 'up' : 'down';
    let arrow = pct > 0 ? '▲' : '▼';
    return '<span class="delta ' + cls + '">' + arrow + ' ' + Math.abs(pct) + '%</span>';
  }

  // ---------------- gráficos (Chart.js) ----------------
  const chartInstances = {};

  function cssVar(name){
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function destroyChart(id){
    if(chartInstances[id]){ chartInstances[id].destroy(); delete chartInstances[id]; }
  }

  function drawBarChart(canvasId, labels, values, highlightIndex, formatter, horizontal){
    destroyChart(canvasId);
    let canvas = document.getElementById(canvasId);
    if(!canvas || typeof Chart === 'undefined') return;

    let primary = cssVar('--primary');
    let secondary = cssVar('--secondary');
    let muted = cssVar('--text-muted');
    let border = cssVar('--border');

    let colors = values.map(function(v, i){ return i === highlightIndex ? secondary : primary; });
    let ctx2d = canvas.getContext('2d');
    let fills = colors.map(function(color){
      let gradient = ctx2d.createLinearGradient(0, 0, horizontal ? canvas.clientWidth : 0, horizontal ? 0 : canvas.clientHeight);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + 'B8');
      return gradient;
    });

    chartInstances[canvasId] = new Chart(ctx2d, {
      type: 'bar',
      data: { labels: labels, datasets: [{ data: values, backgroundColor: fills, hoverBackgroundColor: colors, borderRadius: 10, borderSkipped: false, maxBarThickness: 34, barPercentage: .72, categoryPercentage: .78 }] },
      options: {
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 420, easing: 'easeOutQuart' },
        interaction: { intersect: false, mode: 'index' },
        layout: { padding: { top: 8, right: 8, bottom: 2, left: 2 } },
        plugins: {
          legend: { display: false },
          tooltip: { displayColors: false, padding: 10, cornerRadius: 10, backgroundColor: '#14263D', titleColor: '#FFFFFF', bodyColor: '#EAF2FF', callbacks: { label: function(ctx){ return formatter(ctx.parsed[horizontal ? 'x' : 'y']); } } }
        },
        scales: {
          x: { grid: { display: horizontal, color: border, drawTicks: false }, ticks: { color: muted, font: { size: 11 }, padding: 7, maxRotation: 0 }, border: { display: false } },
          y: { grid: { display: !horizontal, color: border, drawTicks: false }, ticks: { color: muted, font: { size: 11 }, padding: 8 }, border: { display: false }, beginAtZero: true }
        }
      }
    });
  }

  function drawWeeklyPaymentChart(collected, outstanding){
    destroyChart('weeklyPaymentChartCanvas');
    let canvas = document.getElementById('weeklyPaymentChartCanvas');
    if(!canvas || typeof Chart === 'undefined') return;
    let primary = cssVar('--secondary') || cssVar('--primary') || '#2BAE83';
    let warning = cssVar('--warning') || '#E7A23B';
    chartInstances['weeklyPaymentChartCanvas'] = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: { labels: ['Cobrado', 'Pendiente'], datasets: [{ data: [Math.max(0, Number(collected)||0), Math.max(0, Number(outstanding)||0)], backgroundColor: [primary, warning], borderColor: cssVar('--surface') || '#FFFFFF', borderWidth: 4, hoverOffset: 5, borderRadius: 5 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '76%', animation: { duration: 500, easing: 'easeOutQuart' }, plugins: { legend: { display: false }, tooltip: { displayColors: true, padding: 10, cornerRadius: 10, callbacks: { label: function(ctx){ let total = ctx.dataset.data.reduce(function(a,b){return a+b;},0); let value = Number(ctx.parsed)||0; let pct = total ? Math.round(value/total*100) : 0; return ' ' + ctx.label + ': ' + money(value) + ' (' + pct + '%)'; } } } } }
    });
  }

  function renderMonthComparison(){
    let wrap = document.getElementById('periodCompare');
    if(!wrap) return;

    let groups = groupByMonth();
    let keys = Object.keys(groups).sort();

    if(keys.length === 0){
      wrap.innerHTML = '<div class="empty-inline">Todavía no hay ventas suficientes para comparar meses.</div>';
      return;
    }

    let currentMK = monthKey(new Date());
    let monthStats = {};
    keys.forEach(function(k){ monthStats[k] = weekStats(groups[k]); });

    let chartKeys = keys.slice(-6);
    let chartLabels = chartKeys.map(function(k){ return MESES[parseInt(k.split("-")[1], 10) - 1]; });
    let chartValues = chartKeys.map(function(k){ return monthStats[k].total; });
    let chartHighlight = chartKeys.indexOf(currentMK);
    let chartHtml = '<div class="chart-box"><canvas id="periodChartCanvas"></canvas></div>';

    if(!compareMonthA || keys.indexOf(compareMonthA) === -1){ compareMonthA = keys[keys.length - 1]; }
    if(!compareMonthB || keys.indexOf(compareMonthB) === -1){ compareMonthB = keys.length > 1 ? keys[keys.length - 2] : keys[keys.length - 1]; }

    let optionsHtml = keys.slice().reverse().map(function(k){
      return '<option value="' + k + '">' + monthLabel(k) + '</option>';
    }).join('');

    let selectHtml = '<div class="compare-row">' +
      '<select class="compare-select" id="compareSelectA">' + optionsHtml + '</select>' +
      '<select class="compare-select" id="compareSelectB">' + optionsHtml + '</select>' +
    '</div>';

    let stA = monthStats[compareMonthA] || {total:0,cobrado:0,pendiente:0,count:0};
    let stB = monthStats[compareMonthB] || {total:0,cobrado:0,pendiente:0,count:0};

    let tableHtml = '<div class="compare-table-card"><table class="compare-table"><tbody>' +
      '<tr><td class="label"></td><td class="head">' + monthLabel(compareMonthA) + '</td><td class="head">' + monthLabel(compareMonthB) + '</td></tr>' +
      '<tr><td class="label">Total vendido</td><td class="num">' + money(stA.total) + '</td><td class="num">' + money(stB.total) + deltaHtml(stA.total, stB.total) + '</td></tr>' +
      '<tr><td class="label">Cobrado</td><td class="num">' + money(stA.cobrado) + '</td><td class="num">' + money(stB.cobrado) + deltaHtml(stA.cobrado, stB.cobrado) + '</td></tr>' +
      '<tr><td class="label">Pendiente</td><td class="num">' + money(stA.pendiente) + '</td><td class="num">' + money(stB.pendiente) + deltaHtml(stA.pendiente, stB.pendiente) + '</td></tr>' +
      '<tr><td class="label">Artículos vendidos</td><td class="num">' + stA.count + '</td><td class="num">' + stB.count + deltaHtml(stA.count, stB.count) + '</td></tr>' +
    '</tbody></table></div>';

    wrap.innerHTML = chartHtml + selectHtml + tableHtml;
    drawBarChart('periodChartCanvas', chartLabels, chartValues, chartHighlight, money, false);

    document.getElementById('compareSelectA').value = compareMonthA;
    document.getElementById('compareSelectB').value = compareMonthB;
    document.getElementById('compareSelectA').addEventListener('change', function(){
      compareMonthA = this.value; renderMonthComparison();
    });
    document.getElementById('compareSelectB').addEventListener('change', function(){
      compareMonthB = this.value; renderMonthComparison();
    });
  }

  function formatRangeShort(weekStartKey){
    let start = new Date(weekStartKey + "T00:00:00");
    return start.getDate() + " " + MESES[start.getMonth()];
  }

  function renderWeekComparison(){
    let wrap = document.getElementById('periodCompare');
    if(!wrap) return;

    let groups = groupByWeek();
    let keys = Object.keys(groups).sort();

    if(keys.length === 0){
      wrap.innerHTML = '<div class="empty-inline">Todavía no hay ventas suficientes para comparar semanas.</div>';
      return;
    }

    let thisWeekKey = weekKey(new Date());
    let wStats = {};
    keys.forEach(function(k){ wStats[k] = weekStats(groups[k]); });
    // La comparación principal mide importe vendido; el conteo de artículos queda en la tabla.

    let chartKeys = keys.slice(-6);
    let chartLabels = chartKeys.map(formatRangeShort);
    let chartValues = chartKeys.map(function(k){ return wStats[k].total; });
    let chartHighlight = chartKeys.indexOf(thisWeekKey);
    let latestStats = wStats[chartKeys[chartKeys.length - 1]] || {cobrado:0,pendiente:0};
    let chartHtml = '<div class="comparison-chart-heading"><strong>Importe vendido por semana</strong><span>Últimas 6 semanas</span></div><div class="chart-box chart-box-modern"><canvas id="periodChartCanvas"></canvas></div>' +
      '<div class="comparison-chart-heading payment-chart-heading"><strong>Cobrado vs. pendiente</strong><span>Semana más reciente con ventas</span></div>' +
      '<div class="payment-chart-layout"><div class="chart-box chart-box-doughnut payment-doughnut"><canvas id="weeklyPaymentChartCanvas"></canvas><div class="payment-chart-center"><small>Total vendido</small><strong id="weeklyPaymentTotal">'+money(latestStats.cobrado+latestStats.pendiente)+'</strong></div></div>' +
      '<div class="payment-chart-legend"><div><span class="payment-legend-dot collected"></span><span>Cobrado</span><strong>'+money(latestStats.cobrado)+'</strong></div><div><span class="payment-legend-dot outstanding"></span><span>Pendiente</span><strong>'+money(latestStats.pendiente)+'</strong></div></div></div>';

    if(!compareWeekA || keys.indexOf(compareWeekA) === -1){ compareWeekA = keys[keys.length - 1]; }
    if(!compareWeekB || keys.indexOf(compareWeekB) === -1){ compareWeekB = keys.length > 1 ? keys[keys.length - 2] : keys[keys.length - 1]; }

    let optionsHtml = keys.slice().reverse().map(function(k){
      return '<option value="' + k + '">Semana del ' + formatRange(k) + '</option>';
    }).join('');

    let selectHtml = '<div class="compare-row">' +
      '<select class="compare-select" id="compareWeekSelectA">' + optionsHtml + '</select>' +
      '<select class="compare-select" id="compareWeekSelectB">' + optionsHtml + '</select>' +
    '</div>';

    let stA = wStats[compareWeekA] || {total:0,cobrado:0,pendiente:0,count:0};
    let stB = wStats[compareWeekB] || {total:0,cobrado:0,pendiente:0,count:0};

    let tableHtml = '<div class="compare-table-card"><table class="compare-table"><tbody>' +
      '<tr><td class="label"></td><td class="head">' + formatRange(compareWeekA) + '</td><td class="head">' + formatRange(compareWeekB) + '</td></tr>' +
      '<tr><td class="label">Artículos vendidos</td><td class="num">' + stA.count + '</td><td class="num">' + stB.count + deltaHtml(stA.count, stB.count) + '</td></tr>' +
      '<tr><td class="label">Total vendido</td><td class="num">' + money(stA.total) + '</td><td class="num">' + money(stB.total) + deltaHtml(stA.total, stB.total) + '</td></tr>' +
      '<tr><td class="label">Cobrado</td><td class="num">' + money(stA.cobrado) + '</td><td class="num">' + money(stB.cobrado) + deltaHtml(stA.cobrado, stB.cobrado) + '</td></tr>' +
      '<tr><td class="label">Pendiente</td><td class="num">' + money(stA.pendiente) + '</td><td class="num">' + money(stB.pendiente) + deltaHtml(stA.pendiente, stB.pendiente) + '</td></tr>' +
    '</tbody></table></div>';

    wrap.innerHTML = chartHtml + selectHtml + tableHtml;
    drawBarChart('periodChartCanvas', chartLabels, chartValues, chartHighlight, money, false);
    drawWeeklyPaymentChart(latestStats.cobrado, latestStats.pendiente);

    document.getElementById('compareWeekSelectA').value = compareWeekA;
    document.getElementById('compareWeekSelectB').value = compareWeekB;
    document.getElementById('compareWeekSelectA').addEventListener('change', function(){
      compareWeekA = this.value; renderWeekComparison();
    });
    document.getElementById('compareWeekSelectB').addEventListener('change', function(){
      compareWeekB = this.value; renderWeekComparison();
    });
  }

  function renderTopCategoryChart(){
    let wrap = document.getElementById('topCategoryChart');
    if(!wrap) return;

    let currentMonthKey = monthKey(new Date());
    let monthItems = sales.filter(function(s){ return monthKey(s.fecha) === currentMonthKey; });

    if(monthItems.length === 0){
      wrap.innerHTML = '<div class="empty-inline">Todavía no hay ventas este mes.</div>';
      return;
    }

    let byCat = {};
    monthItems.forEach(function(s){
      let cat = s.categoria || 'Sin categoría';
      byCat[cat] = (byCat[cat] || 0) + 1;
    });

    let ranked = Object.keys(byCat).map(function(k){ return { name: k, count: byCat[k] }; });
    ranked.sort(function(a, b){ return b.count - a.count; });

    let totalCount = ranked.reduce(function(sum, c){ return sum + c.count; }, 0);

    let html = '<div class="chart-box chart-box-doughnut">' +
      '<canvas id="categoryChartCanvas"></canvas>' +
      '<div class="doughnut-center"><div class="doughnut-total">' + totalCount + '</div><div class="doughnut-label">artículos</div></div>' +
    '</div><div class="cat-legend">';
    ranked.forEach(function(c){
      let pct = Math.round((c.count / totalCount) * 100);
      html += '<div class="cat-legend-row">' +
        '<span class="cat-dot" style="background:' + categoryColor(c.name) + '"></span>' +
        '<span class="cat-legend-name">' + escapeHtml(c.name) + '</span>' +
        '<span class="cat-legend-count">' + c.count + ' · ' + pct + '%</span>' +
      '</div>';
    });
    html += '</div>';
    wrap.innerHTML = html;

    destroyChart('categoryChartCanvas');
    let canvas = document.getElementById('categoryChartCanvas');
    if(canvas && typeof Chart !== 'undefined'){
      chartInstances['categoryChartCanvas'] = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ranked.map(function(c){ return c.name; }),
          datasets: [{
            data: ranked.map(function(c){ return c.count; }),
            backgroundColor: ranked.map(function(c){ return categoryColor(c.name); }),
            borderColor: cssVar('--surface'),
            borderWidth: 4,
            borderRadius: 5,
            hoverOffset: 8,
            spacing: 2
          }]
        },
        options: {
          cutout: '72%',
          maintainAspectRatio: false,
          animation: { animateRotate: true, animateScale: true, duration: 500, easing: 'easeOutQuart' },
          layout: { padding: 6 },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: function(ctx){ return ctx.label + ': ' + ctx.parsed + ' art.'; } } }
          }
        }
      });
    }
  }


  let showRankingMoney = false;
  let rankingVisibleCount = 5;

  function renderTopClients(){
    let wrap = document.getElementById('topClients');
    if(!wrap) return;

    if(sales.length === 0){
      wrap.innerHTML = '<div class="empty-inline">Todavía no hay ventas registradas.</div>';
      return;
    }

    let byClient = {};
    sales.forEach(function(s){
      let name = s.cliente || 'Sin nombre';
      if(!byClient[name]){ byClient[name] = { name: name, count: 0, total: 0 }; }
      byClient[name].count += 1;
      byClient[name].total += Number(s.precio) || 0;
    });

    // El ranking ordena por CANTIDAD de artículos comprados (no por monto).
    let ranked = Object.keys(byClient).map(function(k){ return byClient[k]; });
    ranked.sort(function(a, b){ return b.count - a.count || b.total - a.total; });

    let visible = ranked.slice(0, rankingVisibleCount);

    let medals = ['🥇','🥈','🥉'];
    let html = '<div class="rank-list">';
    visible.forEach(function(c, idx){
      let medal = medals[idx] || ('#' + (idx + 1));
      html += '<div class="rank-item' + (showRankingMoney ? ' has-money' : '') + '">' +
        '<div class="rank-medal">' + medal + '</div>' +
        '<div class="rank-info">' +
          '<button type="button" class="rank-name client-name-link" data-client-link="' + escapeHtml(c.name) + '">' + escapeHtml(c.name) + '</button>' +
          '<div class="rank-sub">Cliente destacado</div>' +
        '</div>' +
        '<div class="rank-count" aria-label="' + c.count + ' artículos">' + c.count + '</div>' +
        (showRankingMoney ? '<div class="rank-total">' + money(c.total) + '</div>' : '') +
      '</div>';
    });
    html += '</div>';

    if(ranked.length > visible.length){
      html += '<button type="button" class="reset-link" id="rankingShowMoreBtn" style="margin-top:12px;">Ver más (' + (ranked.length - visible.length) + ' restantes)</button>';
    }

    wrap.innerHTML = html;

    const rankingMoreBtn = document.getElementById('rankingShowMoreBtn');
    if(rankingMoreBtn){
      rankingMoreBtn.addEventListener('click', function(){
        rankingVisibleCount += 5;
        renderTopClients();
      });
    }
  }

  const toggleRankingMoneyBtn = document.getElementById('toggleRankingMoney');
  if(toggleRankingMoneyBtn){
    toggleRankingMoneyBtn.addEventListener('click', function(){
      showRankingMoney = !showRankingMoney;
      toggleRankingMoneyBtn.textContent = showRankingMoney ? '💰 Ocultar montos gastados' : '💰 Mostrar montos gastados';
      renderTopClients();
    });
  }

  function getRankedClients(){
    let byClient = {};
    sales.forEach(function(s){
      let name = s.cliente || 'Sin nombre';
      if(!byClient[name]) byClient[name] = {name:name,count:0,total:0};
      byClient[name].count += 1;
      byClient[name].total += Number(s.precio) || 0;
    });
    return Object.keys(byClient).map(function(k){return byClient[k];}).sort(function(a,b){return b.count-a.count || b.total-a.total;});
  }

  async function shareCustomerRanking(){
    const ranked = getRankedClients();
    if(!ranked.length){ showToast('Todavía no hay ventas para compartir el ranking.'); return; }
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const palette = dark ? {
      pageA:'#14101f',pageB:'#262238',cardA:'#30264a',cardB:'#1e1b2e',
      row:'#29243b',text:'#f1f0fe',muted:'#b8b0d1',accent:'#b49aff',pill:'#393052',pillText:'#d8ccff',line:'#463b63'
    } : {
      pageA:'#f7f4ff',pageB:'#e9f7ff',cardA:'#3216d9',cardB:'#7657ff',
      row:'#ffffff',text:'#211b56',muted:'#706b9a',accent:'#4d35df',pill:'#f0edff',pillText:'#4d35df',line:'#e3ddfb'
    };
    const W=1080, H=1350, canvas=document.createElement('canvas'); canvas.width=W; canvas.height=H;
    const ctx=canvas.getContext('2d');
    const rr=function(x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);};
    const bg=ctx.createLinearGradient(0,0,W,H); bg.addColorStop(0,palette.pageA); bg.addColorStop(1,palette.pageB); ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    const cardGrad=ctx.createLinearGradient(50,40,W-50,H-40); cardGrad.addColorStop(0,palette.cardA); cardGrad.addColorStop(1,palette.cardB);
    ctx.fillStyle=cardGrad; rr(48,48,W-96,H-96,44); ctx.fill();
    ctx.fillStyle=dark?'rgba(180,154,255,.09)':'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.arc(970,100,210,0,Math.PI*2); ctx.fill();
    // El logo se dibuja junto al nombre para que la imagen compartida tenga la marca completa.
    const logo = await new Promise(function(resolve){const img=new Image();img.onload=function(){resolve(img);};img.onerror=function(){resolve(null);};img.src='feritapp-icon.png';});
    if(logo){ctx.save();ctx.beginPath();ctx.arc(132,125,48,0,Math.PI*2);ctx.clip();ctx.drawImage(logo,84,77,96,96);ctx.restore();}
    ctx.fillStyle='#ffffff'; ctx.font='800 54px Arial'; ctx.textAlign='left'; ctx.fillText('FeritApp',200,126);
    ctx.fillStyle=dark?'#d8ccff':'#e8e2ff'; ctx.font='500 25px Arial'; ctx.fillText('Tu negocio, más simple',202,168);
    ctx.fillStyle='#ffffff'; ctx.font='800 42px Arial'; ctx.fillText('Ranking de clientes',92,260);
    ctx.fillStyle=dark?'#e3dcf5':'#e7e2ff'; ctx.font='24px Arial'; ctx.fillText('Los clientes que más artículos compraron',92,302);
    const medals=['🥇','🥈','🥉']; const rows=ranked.slice(0,8); let y=350;
    rows.forEach(function(c,i){
      ctx.fillStyle=palette.row; rr(82,y,W-164,94,22); ctx.fill();
      ctx.fillStyle=['#ffcf36','#c8d1e1','#e6a06a'][i] || palette.line; ctx.beginPath(); ctx.arc(132,y+47,29,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=i<3?'#38235b':palette.accent; ctx.font='800 24px Arial'; ctx.textAlign='center'; ctx.fillText(medals[i] || String(i+1),132,y+56);
      ctx.textAlign='left'; ctx.fillStyle=palette.text; ctx.font='700 29px Arial'; let name=c.name; while(ctx.measureText(name).width>500) name=name.slice(0,-2)+'…'; ctx.fillText(name,185,y+43);
      ctx.fillStyle=palette.muted; ctx.font='20px Arial'; ctx.fillText((i+1)+'° puesto',185,y+72);
      // La imagen compartida muestra los puestos y nombres, sin cantidades de artículos.
      y+=108;
    });
    ctx.fillStyle=dark?'#d8ccff':'#e7e2ff'; ctx.font='22px Arial'; ctx.textAlign='center'; ctx.fillText('Gracias por ser parte de nuestra comunidad 💜',W/2,H-106); ctx.textAlign='left';
    const blob=await new Promise(function(resolve){canvas.toBlob(resolve,'image/png');});
    if(!blob){showToast('No se pudo generar la imagen del ranking.');return;}
    const file=new File([blob],'ranking-feritapp.png',{type:'image/png'});
    const textMsg='🏆 Ranking de clientes de mi tienda en FeritApp';
    if(navigator.canShare && navigator.canShare({files:[file]}) && navigator.share){
      try{await navigator.share({files:[file],text:textMsg});return;}catch(e){if(e && e.name==='AbortError')return;}
    }
    if(navigator.share){try{await navigator.share({title:'Ranking de clientes',text:textMsg});}catch(e){if(e && e.name==='AbortError')return;}}
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(url);},1000);
    showToast('Ranking descargado como imagen para compartir en tus redes.');
  }
  const shareRankingBtn=document.getElementById('shareRankingBtn');
  if(shareRankingBtn) shareRankingBtn.addEventListener('click',shareCustomerRanking);

  function weekStats(items){
    let total=0, cobrado=0, pendiente=0;
    items.forEach(function(i){
      total += Number(i.precio)||0;
      if(i.pagado) cobrado += Number(i.precio)||0;
      else pendiente += Number(i.precio)||0;
    });
    return {total:total, cobrado:cobrado, pendiente:pendiente, count:items.length};
  }

  function renderDashboardTasks(items){
    let wrap = document.getElementById('dashboardTasks');
    if(!wrap) return;

    let unpaid = items.filter(function(s){ return !s.pagado; }).sort(function(a,b){ return Number(b.precio||0) - Number(a.precio||0); });
    // Agrupar los artículos pendientes por cliente para no repetir al mismo cliente una vez por producto.
    let unpaidByClient = {};
    unpaid.forEach(function(s){
      let name = (s.cliente || '').trim() || 'Sin nombre';
      if(!unpaidByClient[name]) unpaidByClient[name] = {name:name, total:0, items:0};
      unpaidByClient[name].total += Number(s.precio)||0;
      unpaidByClient[name].items += 1;
    });
    let unpaidClients = Object.keys(unpaidByClient).map(function(k){ return unpaidByClient[k]; })
      .sort(function(a,b){ return b.total-a.total; });
    let recipients = {};
    items.forEach(function(s){
      let name = s.retira === 'otro' && s.tercero ? s.tercero : (s.cliente || 'Sin nombre');
      if(!recipients[name]) recipients[name] = {name:name, count:0, items:0, pending:0};
      recipients[name].count += 1;
      recipients[name].items += 1;
      if(!s.pagado) recipients[name].pending += Number(s.precio)||0;
    });
    let deliveryPeople = Object.keys(recipients).map(function(k){ return recipients[k]; });
    let recipientCount = deliveryPeople.length;
    let unpaidTotal = unpaid.reduce(function(sum,s){ return sum + (Number(s.precio)||0); },0);

    if(unpaid.length === 0 && items.length === 0){
      wrap.innerHTML = '<div class="dashboard-task is-clear"><div class="dashboard-task-icon">✨</div><div class="dashboard-task-copy"><div class="dashboard-task-title">Todo listo por ahora</div><div class="dashboard-task-sub">Todavía no hay ventas esta semana. Podés empezar registrando una nueva venta.</div><button type="button" class="dashboard-task-action" data-dashboard-action="new-sale">+ Registrar primera venta</button></div></div>';
      bindDashboardTaskActions(wrap);
      return;
    }

    let html = '<div class="dashboard-task-list">';

    if(unpaid.length){
      html += '<article class="dashboard-task dashboard-task-expandable" data-dashboard-expand-card="payments" aria-expanded="false">' +
        '<button type="button" class="dashboard-task-trigger" data-dashboard-expand="payments" aria-expanded="false">' +
          '<span class="dashboard-task-icon">💳</span>' +
          '<span class="dashboard-task-copy"><span class="dashboard-task-title">' + unpaidClients.length + ' ' + (unpaidClients.length === 1 ? 'cliente con cobro pendiente' : 'clientes con cobro pendiente') + '</span>' +
          '<span class="dashboard-task-sub">Tenés ' + money(unpaidTotal) + ' por cobrar.</span></span>' +
          '<span class="dashboard-task-value">' + money(unpaidTotal) + '</span>' +
          '<span class="dashboard-task-chevron" aria-hidden="true">⌄</span>' +
        '</button>' +
        '<div class="dashboard-task-details" data-dashboard-details="payments" hidden>' +
          '<div class="dashboard-detail-heading">Quiénes deben</div>';
      unpaidClients.slice(0,5).forEach(function(client){
        let itemLabel = client.items + ' ' + (client.items === 1 ? 'artículo pendiente' : 'artículos pendientes');
        html += '<div class="dashboard-pending-row"><span class="dashboard-pending-name"><button type="button" class="dashboard-client-link" data-dashboard-client="' + escapeHtml(client.name === 'Sin nombre' ? '' : client.name) + '">' + escapeHtml(client.name) + '</button><span>' + itemLabel + '</span></span><span class="dashboard-pending-money">' + money(client.total) + '</span></div>';
      });
      if(unpaidClients.length > 5){ html += '<div class="dashboard-detail-more">+' + (unpaidClients.length-5) + ' clientes más</div>'; }
      html += '<button type="button" class="dashboard-task-action" data-dashboard-action="payments">Ver todas las ventas pendientes →</button></div></article>';
    }else{
      html += '<article class="dashboard-task is-clear"><div class="dashboard-task-icon">✓</div><div class="dashboard-task-copy"><div class="dashboard-task-title">No hay pagos pendientes</div><div class="dashboard-task-sub">Todas las ventas de esta semana figuran como pagadas.</div></div></article>';
    }

    if(deliveryPeople.length){
      html += '<article class="dashboard-task dashboard-task-expandable" data-dashboard-expand-card="delivery" aria-expanded="false">' +
        '<button type="button" class="dashboard-task-trigger" data-dashboard-expand="delivery" aria-expanded="false">' +
          '<span class="dashboard-task-icon">📦</span>' +
          '<span class="dashboard-task-copy"><span class="dashboard-task-title">' + recipientCount + ' ' + (recipientCount === 1 ? 'persona' : 'personas') + ' para gestionar</span>' +
          '<span class="dashboard-task-sub">Abrí el detalle para ver quién retira cada venta.</span></span>' +
          '<span class="dashboard-task-value">' + items.length + ' ' + (items.length === 1 ? 'art.' : 'arts.') + '</span>' +
          '<span class="dashboard-task-chevron" aria-hidden="true">⌄</span>' +
        '</button>' +
        '<div class="dashboard-task-details" data-dashboard-details="delivery" hidden>' +
          '<div class="dashboard-detail-heading">Quiénes tienen entregas</div>';
      deliveryPeople.slice(0,5).forEach(function(person){
        html += '<div class="dashboard-pending-row"><span class="dashboard-pending-name"><button type="button" class="dashboard-client-link" data-dashboard-client="' + escapeHtml(person.name) + '">' + escapeHtml(person.name) + '</button><span>' + person.items + ' ' + (person.items === 1 ? 'artículo' : 'artículos') + '</span></span><span class="dashboard-pending-money">' + (person.pending ? 'Debe ' + money(person.pending) : 'Pagado') + '</span></div>';
      });
      if(deliveryPeople.length > 5){ html += '<div class="dashboard-detail-more">+' + (deliveryPeople.length-5) + ' personas más</div>'; }
      html += '<button type="button" class="dashboard-task-action" data-dashboard-action="delivery">Ver todas las entregas →</button></div></article>';
    }

    html += '</div>';
    wrap.innerHTML = html;
    bindDashboardTaskActions(wrap);
    bindDashboardExpanders(wrap);
    wrap.querySelectorAll('[data-dashboard-client]').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.stopPropagation(); let name = btn.getAttribute('data-dashboard-client'); if(name) openClientDetails(name); });
    });
  }

  function bindDashboardExpanders(root){
    root.querySelectorAll('[data-dashboard-expand]').forEach(function(trigger){
      trigger.addEventListener('click', function(){
        let type = trigger.getAttribute('data-dashboard-expand');
        let card = root.querySelector('[data-dashboard-expand-card="' + type + '"]');
        let details = root.querySelector('[data-dashboard-details="' + type + '"]');
        if(!card || !details) return;
        let expanded = card.getAttribute('aria-expanded') === 'true';
        card.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        trigger.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        details.hidden = expanded;
      });
    });
  }

  function bindDashboardTaskActions(root){
    root.querySelectorAll('[data-dashboard-action]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        let action = btn.getAttribute('data-dashboard-action');
        if(action === 'new-sale'){ openSheet(); return; }
        if(action === 'delivery'){ switchView('deliveries'); return; }
        switchView('sales');
        if(action !== 'delivery'){
          let itemsBtn = document.querySelector('[data-salestab="items"]');
          if(itemsBtn) itemsBtn.click();
          setTimeout(function(){
            let firstPending = document.querySelector('#currentWeekTable .pay-toggle.pending');
            if(firstPending){ firstPending.scrollIntoView({behavior:'smooth',block:'center'}); }
          }, 80);
        }
      });
    });
  }

  function renderSalesTable(items, editable){
    if(!items.length){
      return '<div class="empty-inline">Sin artículos registrados.</div>';
    }

    /*
     * Desktop: keep the familiar compact table.
     * Mobile: use one card per sale so the status and actions never fall
     * outside the viewport. No horizontal scrolling is needed on phones.
     */
    let desktop = '<div class="table-card sales-table-desktop"><div class="table-wrap"><table class="sales-table"><thead><tr>' +
      '<th>Artículo</th><th>Cliente</th><th class="num">Precio</th><th>Estado</th><th></th>' +
      '</tr></thead><tbody>';

    let mobile = '<div class="sales-cards-mobile">';

    items.forEach(function(item){
      let fechaTxt = new Date(item.fecha).toLocaleDateString('es-AR', {weekday:'short', day:'numeric', month:'short'});
      let cat = item.categoria || 'Sin categoría';
      let retiraHtml = item.retira === 'otro'
        ? '<div class="retira-info other">↳ Retira: ' + escapeHtml(item.tercero) + '</div>'
        : '<div class="retira-info same">↳ Retira el mismo cliente</div>';
      let statusClass = item.pagado ? 'paid' : 'pending';
      let statusText = item.pagado ? 'Pagado' : 'Pendiente';

      desktop += '<tr>' +
        '<td>' +
          '<div class="item-name">' + escapeHtml(item.articulo) + '</div>' +
          '<span class="cat-badge"><span class="cat-dot" style="background:' + categoryColor(cat) + '"></span>' + escapeHtml(cat) + '</span>' +
          '<div class="item-meta">' + fechaTxt + '</div>' +
        '</td>' +
        '<td><button type="button" class="client-name client-name-link" data-client-link="' + escapeHtml(item.cliente || 'Sin nombre') + '">' + escapeHtml(item.cliente || 'Sin nombre') + '</button>' + retiraHtml + '</td>' +
        '<td class="num price-cell">' + money(item.precio) + '</td>' +
        '<td><button class="pay-toggle ' + statusClass + '" data-toggle-pay="' + item.id + '">' + statusText + '</button></td>' +
        '<td><div class="row-actions">' +
          (editable ? '<button class="edit-btn" data-edit="' + item.id + '" aria-label="Editar">✎</button>' : '') +
          '<button class="del-btn" data-del="' + item.id + '" aria-label="Eliminar">✕</button>' +
        '</div></td>' +
      '</tr>';

      mobile += '<article class="sale-card-mobile">' +
        '<div class="sale-card-main">' +
          '<button type="button" class="sale-card-client client-name-link" data-client-link="' + escapeHtml(item.cliente || 'Sin nombre') + '">' + escapeHtml(item.cliente || 'Sin nombre') + '</button>' +
          '<div class="sale-card-item">' + escapeHtml(item.articulo) + '</div>' +
          '<div class="sale-card-meta">' +
            '<span class="sale-card-category"><span class="cat-dot" style="background:' + categoryColor(cat) + '"></span>' + escapeHtml(cat) + '</span>' +
            '<span>' + fechaTxt + '</span>' +
          '</div>' +
          retiraHtml +
        '</div>' +
        '<div class="sale-card-side">' +
          '<div class="sale-card-total">' + money(item.precio) + '</div>' +
          '<button class="pay-toggle ' + statusClass + ' sale-card-status" data-toggle-pay="' + item.id + '">' + statusText + '</button>' +
          '<div class="sale-card-actions">' +
            (editable ? '<button class="edit-btn" data-edit="' + item.id + '" aria-label="Editar">✎</button>' : '') +
            '<button class="del-btn" data-del="' + item.id + '" aria-label="Eliminar">✕</button>' +
          '</div>' +
        '</div>' +
      '</article>';
    });

    desktop += '</tbody></table></div></div>';
    mobile += '</div>';
    return desktop + mobile;
  }

  function renderSalesGroupedByClient(items, idPrefix){
    idPrefix = idPrefix || "sales-current";
    if(!items.length) return '<div class="empty-inline">No hay ventas registradas en este período.</div>';
    const isManagement = idPrefix === 'management';
    const isDeliveries = idPrefix === 'deliveries';
    const isWeeklySummary = idPrefix === 'weekly-summary';
    const isDashboardHistory = idPrefix.indexOf('dashboard-history-') === 0;
    const readOnly = isWeeklySummary || isDashboardHistory;
    const showClientActions = isManagement && !readOnly;
    const showPaymentControl = isManagement || isWeeklySummary;
    const showItemActions = !readOnly && !isManagement;
    // Se calcula una sola vez por render, no una vez por cliente/artículo.
    const previousKey = isWeeklySummary ? previousWeekKey() : null;
    const groups = {};
    items.forEach(function(item){ const key = (item.cliente || 'Sin nombre').trim(); (groups[key] ||= []).push(item); });
    let html = '<div class="sales-client-groups">';
    Object.keys(groups).sort(function(a,b){return a.localeCompare(b,'es');}).forEach(function(name, idx){
      const list = groups[name].slice().sort(function(a,b){return new Date(b.fecha)-new Date(a.fecha);});
      // Una única pasada calcula tanto el total como el pendiente del cliente.
      const totals = list.reduce(function(acc,x){
        const price = Number(x.precio)||0;
        acc.total += price;
        if(!x.pagado) acc.pending += price;
        return acc;
      }, {total:0,pending:0});
      const total = totals.total;
      const pending = totals.pending;
      const id = idPrefix + '-client-group-' + idx;
      const pickup = list.find(function(x){ return x.retira === 'otro' && x.tercero; });
      const pickupLabel = pickup ? ('Retira: ' + pickup.tercero) : ('Retira: ' + name + ' (cliente)');
      const delivered = list.every(function(x){ return !!x.entregado; });
      const managementActions = showClientActions ? '<aside class="management-client-right"><button type="button" class="management-messenger-btn" data-open-messenger="'+escapeHtml(name)+'" aria-label="Abrir Messenger para '+escapeHtml(name)+'"><svg viewBox="0 0 24 24" aria-hidden="true" class="messenger-brand-icon"><path d="M12 2C6.25 2 2 6.13 2 11.45c0 2.98 1.42 5.57 3.65 7.28.19.15.31.4.32.65l.06 2.02c.02.32.35.53.64.41l2.25-.99c.19-.08.39-.1.59-.04.79.22 1.63.34 2.49.34 5.75 0 10-4.13 10-9.45S17.75 2 12 2Zm1.02 12.72-2.55-2.72a.8.8 0 0 0-.96-.15l-3.05 1.63c-.32.17-.66-.2-.44-.49l3.25-4.34a1.2 1.2 0 0 1 1.83-.13l2.55 2.72a.8.8 0 0 0 .96.15l3.05-1.63c.32-.17.66.2.44.49l-3.25 4.34a1.2 1.2 0 0 1-1.83.13Z"/></svg><span>Messenger</span></button><button type="button" data-share-client="'+escapeHtml(name)+'">▣ Comprobante</button><button type="button" data-add-client-sale="'+escapeHtml(name)+'">Editar Venta</button></aside>' : '';
      const expandOnly = isDashboardHistory ? ' dashboard-history-client-group' : (isWeeklySummary ? ' weekly-summary-client-group' : '');
      const summaryIsPreviousWeek = isWeeklySummary;
      const deliveryStatus = isDeliveries
        ? '<button type="button" class="delivery-status '+(delivered?'paid':'pending')+'" data-client="'+escapeHtml(name)+'" data-set-delivery="'+(delivered?'pending':'delivered')+'">'+(delivered?'Entregado':'Por Entregar')+'</button>'
        : (summaryIsPreviousWeek ? '<span class="delivery-status weekly-summary-delivery-status '+(delivered?'paid':'pending')+'" data-weekly-delivery-status="'+(delivered?'delivered':'pending')+'">'+(delivered?'Entregado':'Por Entregar')+'</span>' : '');
      html += '<section class="sales-client-group'+expandOnly+'"><div class="sales-client-group-header"><button type="button" class="sales-client-group-trigger" data-sales-group="'+id+'" aria-expanded="false" aria-label="Ver compras de '+escapeHtml(name)+'"><span class="client-avatar">'+escapeHtml((name.charAt(0)||'C').toUpperCase())+'</span><span class="sales-client-group-copy"><strong>'+escapeHtml(name)+'</strong><small>'+list.length+' '+(list.length===1?'artículo':'artículos')+' · '+money(total)+'</small><small class="sales-retira-label">'+escapeHtml(pickupLabel)+'</small></span></button><div class="sales-group-statuses">'+(showPaymentControl ? '<button type="button" class="delivery-status '+(pending===0?'paid':'pending')+'" data-set-payment="'+escapeHtml(name)+'">'+(pending===0?'Abonado':'Pendiente de Pago')+'</button>' : '<span class="delivery-status '+(pending===0?'paid':'pending')+'">'+(pending===0?'Abonado':'Pendiente de Pago')+'</span>')+deliveryStatus+'<button type="button" class="sales-group-chevron" data-sales-group="'+id+'" aria-label="Expandir o contraer" aria-expanded="false">⌄</button></div></div><div class="sales-client-group-content '+(isManagement?'management-expanded-layout':'')+'" id="'+id+'" hidden>'+(isManagement?'<div class="management-items-column"><div class="management-last-purchase"><strong>Última compra</strong><span>'+ (list[0].fecha ? new Date(list[0].fecha).toLocaleDateString('es-AR',{day:'numeric',month:'short'}) : 'Sin fecha') +'</span></div>':'');
      list.forEach(function(item){ const cat=item.categoria||'Sin categoría'; const date=item.fecha?new Date(item.fecha).toLocaleDateString('es-AR',{day:'numeric',month:'short'}):'';
        html += '<article class="sales-group-item"'+(isManagement?' data-sale-id="'+escapeHtml(item.id)+'" tabindex="0" role="button" aria-label="Venta de '+escapeHtml(item.articulo||'artículo')+'. Mantener presionado o pulsar Enter para habilitar eliminar"':'')+'><div class="sales-group-item-main"><strong>'+escapeHtml(item.articulo||'Artículo')+'</strong><small>'+escapeHtml(cat)+' · '+date+'</small></div><div class="sales-group-item-side"><strong>'+money(item.precio)+'</strong>'+(!showItemActions?'':'<button class="pay-toggle '+(item.pagado?'paid':'pending')+'" data-toggle-pay="'+item.id+'">'+(item.pagado?'Abonado':'Pendiente de Pago')+'</button>')+(showItemActions?'<span class="row-actions"><button class="edit-btn" data-edit="'+item.id+'" aria-label="Editar artículo">✎</button></span>':'')+'</div></article>';
      });
      html += '<div class="sales-group-total"><span>Total</span><strong>'+money(total)+'</strong></div>'+(isManagement?'</div>'+managementActions+'</div>':'')+'</div></section>';
    });
    html += '</div>';
    return html;
  }

  function bindTableEvents(root){
    function resetDeleteSelection(card){
      if(!card) return;
      const toggle=card.querySelector('.sales-group-chevron');
      if(toggle){toggle.removeAttribute('data-delete-target-ids');toggle.removeAttribute('title');toggle.textContent='⌄';toggle.classList.remove('delete-selected');toggle.setAttribute('aria-label','Expandir o contraer');}
    }
    function selectDeleteTarget(card){
      if(!card) return;
      root.querySelectorAll('.sales-client-group').forEach(function(other){if(other!==card) resetDeleteSelection(other);});
      resetDeleteSelection(card);
      const ids=Array.from(card.querySelectorAll('.sales-group-item[data-sale-id]')).map(function(item){return item.getAttribute('data-sale-id');}).filter(Boolean);
      const toggle=card.querySelector('.sales-group-chevron');
      if(toggle && ids.length){
        toggle.setAttribute('data-delete-target-ids',ids.join(','));
        toggle.textContent='✕';
        toggle.classList.add('delete-selected');
        toggle.setAttribute('title','Eliminar ventas de este cliente');
        const title=card.querySelector('.sales-client-group-copy strong');
        toggle.setAttribute('aria-label','Eliminar las ventas de '+(title?title.textContent.trim():'este cliente'));
        card.dataset.deleteSelectionTriggered='true';
        showToast('Tarjeta seleccionada. Tocá la X roja para eliminar las ventas de este cliente.',2600);
      }
    }
    root.querySelectorAll('button[data-sales-group]').forEach(function(btn){ btn.addEventListener('click', function(event){
      event.preventDefault(); event.stopPropagation();
      const idsValue=btn.getAttribute('data-delete-target-ids');
      if(idsValue){
        const ids=idsValue.split(',').filter(Boolean);
        const card=btn.closest('.sales-client-group');
        const title=card && card.querySelector('.sales-client-group-copy strong');
        const clientName=title?title.textContent.trim():'este cliente';
        const matching=sales.filter(function(item){return ids.includes(String(item.id));});
        resetDeleteSelection(card);
        if(!matching.length) return;
        confirmDeleteClientSales(clientName,matching.length).then(function(confirmed){if(confirmed) deleteSalesGroup(ids);});
        return;
      }
      const groupId=btn.getAttribute('data-sales-group'); const panel=document.getElementById(groupId); if(!panel)return; const opening=panel.hidden; panel.hidden=!opening; root.querySelectorAll('button[data-sales-group="'+groupId+'"]').forEach(function(toggle){toggle.setAttribute('aria-expanded',String(opening));toggle.classList.toggle('expanded',opening);});
    }); });
    // La pulsación se registra en la cabecera principal de la tarjeta del cliente,
    // no sobre los artículos del detalle expandido.
    root.querySelectorAll('.sales-client-group-header').forEach(function(header){
      const card=header.closest('.sales-client-group');
      if(!card || !card.querySelector('.sales-group-item[data-sale-id]')) return;
      let pressTimer=null, startX=0, startY=0, longPressTriggered=false;
      const clearPress=function(){if(pressTimer!==null){window.clearTimeout(pressTimer);pressTimer=null;}};
      header.addEventListener('pointerdown',function(event){
        if(event.target && event.target.closest('.sales-group-chevron,[data-set-payment],[data-open-messenger],[data-share-client],[data-add-client-sale]')) return;
        if(event.isPrimary===false || (event.button!==undefined && event.button!==0)) return;
        clearPress(); startX=event.clientX; startY=event.clientY; longPressTriggered=false;
        pressTimer=window.setTimeout(function(){
          pressTimer=null; longPressTriggered=true;
          selectDeleteTarget(card);
        },650);
      });
      header.addEventListener('pointermove',function(event){if(pressTimer!==null && (Math.abs(event.clientX-startX)>18 || Math.abs(event.clientY-startY)>18)) clearPress();});
      header.addEventListener('pointerup',function(){clearPress();});
      header.addEventListener('pointercancel',function(){clearPress();});
      header.addEventListener('lostpointercapture',function(){clearPress();});
      header.addEventListener('contextmenu',function(event){event.preventDefault();});
      header.addEventListener('click',function(event){
        if(longPressTriggered){longPressTriggered=false;event.preventDefault();event.stopPropagation();}
        if(card.dataset.deleteSelectionTriggered==='true' && event.target.closest('.sales-client-group-trigger')){delete card.dataset.deleteSelectionTriggered;event.preventDefault();event.stopPropagation();}
      },true);
      header.addEventListener('keydown',function(event){if(event.key==='Escape'){resetDeleteSelection(card);}});
    });
    root.querySelectorAll('[data-toggle-delivery-card]').forEach(function(btn){
      btn.addEventListener('click',function(){
        const panelId=btn.getAttribute('data-toggle-delivery-card');
        const panel=document.getElementById(panelId);
        if(!panel) return;
        const opening=panel.hidden;
        panel.hidden=!opening;
        root.querySelectorAll('[data-toggle-delivery-card="' + panelId + '"]').forEach(function(toggle){
          toggle.setAttribute('aria-expanded',String(opening));
          toggle.classList.toggle('expanded',opening);
        });
      });
    });
    root.querySelectorAll('[data-set-payment]').forEach(function(btn){ btn.addEventListener('click', async function(){
      const name=btn.getAttribute('data-set-payment');
      const expandedNames=Array.from(root.querySelectorAll('.sales-client-group')).filter(function(card){const panel=card.querySelector('.sales-client-group-content');return panel && !panel.hidden;}).map(function(card){const title=card.querySelector('.sales-client-group-copy strong');return title?title.textContent.trim():'';});
      const targetWeekKey = root.id === 'weeklySummaryContent' ? previousWeekKey() : weekKey(new Date());
      const group=salesForWeek(sales,targetWeekKey).filter(function(x){return (x.cliente||'Sin nombre').trim()===name;});
      if(!group.length) { showToast('No se encontraron ventas de este cliente en esa semana.'); return; }
      const next=!group.every(function(x){return !!x.pagado;}); const ids=group.map(function(x){return x.id;});
      try {
        const result=await sb.from('sales').update({pagado:next}).in('id',ids); if(result && result.error) throw result.error;
        group.forEach(function(x){x.pagado=next;}); render();
        setTimeout(function(){
          const targetRoot = root.id === 'weeklySummaryContent' ? document.getElementById('weeklySummaryContent') : document.getElementById('currentWeekTable');
          if(!targetRoot) return;
          targetRoot.querySelectorAll('.sales-client-group').forEach(function(card){const title=card.querySelector('.sales-client-group-copy strong');if(title && expandedNames.includes(title.textContent.trim())){const panel=card.querySelector('.sales-client-group-content');const trigger=card.querySelector('button[data-sales-group]');if(panel){panel.hidden=false;if(trigger){trigger.setAttribute('aria-expanded','true');trigger.classList.add('expanded');}}}});
        },0);
      } catch(e){showToast('No se pudo actualizar el estado de pago.');}
    }); });
    root.querySelectorAll('[data-toggle-pay]').forEach(function(btn){
      btn.addEventListener('click', function(){
        let id = btn.getAttribute('data-toggle-pay');
        let item = sales.find(function(s){ return s.id === id; });
        if(item){ toggleSalePago(id, item.pagado); }
      });
    });
    root.querySelectorAll('[data-del]').forEach(function(btn){
      btn.addEventListener('click', function(){
        let id = btn.getAttribute('data-del');
        let item = sales.find(function(s){ return s.id === id; });
        if(!item) return;
        confirmDeleteSale(item).then(function(confirmed){if(confirmed) deleteSale(id);});
      });
    });
    root.querySelectorAll('[data-edit]').forEach(function(btn){
      btn.addEventListener('click', function(){ let id=btn.getAttribute('data-edit'); let item=sales.find(function(s){return s.id===id;}); if(item) openEditSheet(item); });
    });
    root.querySelectorAll('[data-copy-client]').forEach(function(btn){ btn.addEventListener('click', async function(){ const name=btn.getAttribute('data-copy-client'); try{ await navigator.clipboard.writeText(name); showToast('Nombre copiado'); }catch(e){ showToast('No se pudo copiar el nombre en este navegador.'); } }); });
    root.querySelectorAll('[data-open-messenger]').forEach(function(btn){ btn.addEventListener('click', function(){ openMessengerForClientName(btn.getAttribute('data-open-messenger')); }); });
    root.querySelectorAll('[data-share-client]').forEach(function(btn){ btn.addEventListener('click', function(){ const name=btn.getAttribute('data-share-client'); const its=sales.filter(function(x){return x.cliente===name;}).sort(function(a,b){return new Date(b.fecha)-new Date(a.fecha);}); if(its.length) shareReceipt(name,its); else showToast('Este cliente todavía no tiene ventas.'); }); });
    root.querySelectorAll('[data-add-client-sale]').forEach(function(btn){ btn.addEventListener('click', function(){ openClientSalesEditor(btn.getAttribute('data-add-client-sale')); }); });
    root.querySelectorAll('[data-toggle-delivery-client]').forEach(function(btn){ btn.addEventListener('click', function(){ toggleDeliveryForClient(btn.getAttribute('data-toggle-delivery-client'), 'all'); }); });
    root.querySelectorAll('[data-set-delivery-client]').forEach(function(btn){ btn.addEventListener('click', function(event){
      event.preventDefault(); event.stopPropagation();
      const name=btn.getAttribute('data-set-delivery-client');
      const desired=btn.getAttribute('data-next-delivery')==='delivered';
      setDeliveryForVisibleClient(name, desired);
    }); });
    root.querySelectorAll('[data-set-delivery]').forEach(function(btn){ btn.addEventListener('click', function(){ const name=btn.getAttribute('data-client'); const desired=btn.getAttribute('data-set-delivery')==='delivered'; const targetWeekKey=btn.getAttribute('data-week-key'); setDeliveryForClient(name, desired, targetWeekKey); }); });
  }

  let managementFilter = 'all';
  function renderManagementList(){
    const search = (document.getElementById('managementSearch')?.value || '').trim().toLowerCase();
    const thisWeek = weekKey(new Date());
    const current = salesForWeek(sales, thisWeek);
    const summary = current.reduce(function(acc, item){
      const price = Number(item.precio) || 0;
      acc.total += price;
      if(!item.pagado) acc.owed += price;
      const client = (item.cliente || '').trim().toLowerCase();
      if(client) acc.clients.add(client);
      return acc;
    }, {total:0, owed:0, clients:new Set()});
    const total = summary.total;
    const owed = summary.owed;
    document.getElementById('managementClientCount').textContent = summary.clients.size;
    document.getElementById('managementWeekTotal').textContent = money(total);
    document.getElementById('managementOwedTotal').textContent = money(owed);
    let filtered = current.filter(function(x){
      const hay = ((x.cliente||'')+' '+(x.articulo||'')+' '+(x.categoria||'')).toLowerCase();
      if(search && !hay.includes(search)) return false;
      if(managementFilter==='unpaid' && x.pagado) return false;
      if(managementFilter==='paid' && !x.pagado) return false;
      return true;
    });
    const wrap = document.getElementById('currentWeekTable');
    wrap.innerHTML = renderSalesGroupedByClient(filtered, 'management');
    bindTableEvents(wrap);
  }
  function renderDeliveriesView(){
    const search = (document.getElementById('managementSearch')?.value || '').trim().toLowerCase();
    const currentKey = weekKey(new Date());
    const previousKey = previousWeekKey();
    const twoWeeksAgoDate = startOfWeek(new Date());
    twoWeeksAgoDate.setDate(twoWeeksAgoDate.getDate() - 14);
    const twoWeeksAgoKey = weekKey(twoWeeksAgoDate);
    const visibleKeys = [currentKey, previousKey, twoWeeksAgoKey].filter(Boolean);
    const weekLabel = function(key){
      if(key===currentKey) return 'Semana actual';
      if(key===previousKey) return 'Semana anterior';
      return 'Hace 2 semanas';
    };
    const items = sales.filter(function(x){
      if(!x || !x.fecha) return false;
      const date = new Date(x.fecha);
      if(Number.isNaN(date.getTime())) return false;
      const itemWeekKey = weekKey(date);
      if(!visibleKeys.includes(itemWeekKey)) return false;
      // Las tres semanas visibles conservan tanto entregados como pendientes.
      // Marcar una entrega como realizada no debe hacer desaparecer al cliente.
      const hay = ((x.cliente||'')+' '+(x.articulo||'')+' '+(x.categoria||'')).toLowerCase();
      return hay.includes(search);
    });
    // Primero se agrupa por cliente y dentro de cada cliente por semana. Así un
    // cliente aparece una sola vez, pero mantiene estados independientes por semana.
    const clients = {};
    items.forEach(function(item){
      const name = (item.cliente || 'Sin nombre').trim();
      const itemWeekKey = weekKey(new Date(item.fecha));
      if(!clients[name]) clients[name] = {name:name, weeks:{}, total:0};
      const client = clients[name];
      if(!client.weeks[itemWeekKey]) client.weeks[itemWeekKey] = {weekKey:itemWeekKey,items:[],total:0,pendingPayment:0,delivered:true};
      const group = client.weeks[itemWeekKey];
      const price = Number(item.precio)||0;
      group.items.push(item);
      group.total += price;
      client.total += price;
      if(!item.pagado) group.pendingPayment += price;
      if(!item.entregado) group.delivered = false;
    });
    const clientGroups = Object.keys(clients).map(function(name){
      const client=clients[name];
      client.weekGroups=Object.keys(client.weeks).map(function(key){return client.weeks[key];}).sort(function(a,b){return b.weekKey.localeCompare(a.weekKey);});
      return client;
    }).sort(function(a,b){return a.name.localeCompare(b.name,'es');});
    const wrap = document.getElementById('deliveriesList');
    wrap.innerHTML = clientGroups.length ? clientGroups.map(function(client, clientIndex){
      const weeksPanelId='delivery-client-weeks-'+clientIndex;
      const weekRows=client.weekGroups.map(function(group){
        const label=weekLabel(group.weekKey);
        return '<section class="delivery-week-row '+(group.weekKey===currentKey?'is-current-week':'is-previous-week')+'">'+
          '<div class="delivery-week-summary"><span class="delivery-week-label">'+escapeHtml(label)+'</span><small>'+escapeHtml(formatRange(group.weekKey))+' · '+group.items.length+' '+(group.items.length===1?'artículo':'artículos')+' · '+money(group.total)+'</small></div></section>';
      }).join('');
      // Un único estado resume las entregas visibles del cliente; el detalle por semana
      // muestra artículos y totales, sin duplicar estados dentro de cada semana.
      const clientItems=client.weekGroups.reduce(function(all,group){return all.concat(group.items);},[]);
      const delivered=clientItems.length>0 && clientItems.every(function(item){return !!item.entregado;});
      const statusButton='<button type="button" class="delivery-client-status '+(delivered?'is-delivered':'is-pending')+'" data-set-delivery-client="'+escapeHtml(client.name)+'" data-next-delivery="'+(delivered?'pending':'delivered')+'" aria-label="Cambiar estado de entrega de '+escapeHtml(client.name)+' a '+(delivered?'Por Entregar':'Entregado')+'">'+(delivered?'Entregado':'Por Entregar')+'</button>';
      return '<article class="delivery-client-card"><div class="delivery-client-header"><button type="button" class="delivery-client-trigger" data-toggle-delivery-card="'+weeksPanelId+'" aria-expanded="false" aria-controls="'+weeksPanelId+'"><span class="client-avatar">'+escapeHtml((client.name.charAt(0)||'C').toUpperCase())+'</span><span class="delivery-client-heading-copy"><strong>'+escapeHtml(client.name)+'</strong><small>'+client.weekGroups.length+' '+(client.weekGroups.length===1?'semana visible':'semanas visibles')+' · '+money(client.total)+'</small></span></button>'+statusButton+'<button type="button" class="delivery-client-chevron-toggle" data-toggle-delivery-card="'+weeksPanelId+'" aria-label="Expandir o contraer semanas de '+escapeHtml(client.name)+'" aria-expanded="false" aria-controls="'+weeksPanelId+'">⌄</button></div><div class="delivery-client-weeks" id="'+weeksPanelId+'" hidden>'+weekRows+'</div></article>';
    }).join('') : '<div class="empty-inline">No hay entregas para este filtro.</div>';
    bindTableEvents(wrap);
  }
  async function setDeliveryForVisibleClient(name, desired){
    const currentKey=weekKey(new Date());
    const previousKey=previousWeekKey();
    const twoWeeksAgoDate=startOfWeek(new Date());
    twoWeeksAgoDate.setDate(twoWeeksAgoDate.getDate()-14);
    const twoWeeksAgoKey=weekKey(twoWeeksAgoDate);
    const visibleKeys=new Set([currentKey,previousKey,twoWeeksAgoKey].filter(Boolean));
    const items=sales.filter(function(item){
      if(!item || !item.fecha || (item.cliente||'Sin nombre').trim()!==name) return false;
      const date=new Date(item.fecha);
      if(Number.isNaN(date.getTime())) return false;
      const key=weekKey(date);
      if(!visibleKeys.has(key)) return false;
      // El estado del cliente se aplica a todas sus ventas de las tres semanas
      // visibles, incluidas las ya entregadas, para que pueda alternarse sin ocultarlas.
      return true;
    });
    if(!items.length) return;
    const changed=items.filter(function(item){return !!item.entregado!==desired;});
    if(!changed.length) return;
    try{
      const ids=changed.map(function(item){return item.id;});
      const result=await sb.from('sales').update({entregado:desired}).in('id',ids);
      if(result.error) throw result.error;
      changed.forEach(function(item){item.entregado=desired;});
      render();
      showToast(desired?'Entregas marcadas como entregadas':'Entregas marcadas como pendientes');
    }catch(error){
      showToast('No se pudo actualizar el estado de entrega.');
    }
  }

  async function setDeliveryForClient(name, desired, targetWeekKey){
    const currentKey = weekKey(new Date());
    const previousKey = previousWeekKey();
    const twoWeeksAgoDate = startOfWeek(new Date());
    twoWeeksAgoDate.setDate(twoWeeksAgoDate.getDate() - 14);
    const twoWeeksAgoKey = weekKey(twoWeeksAgoDate);
    const visibleKeys = new Set([currentKey, previousKey, twoWeeksAgoKey].filter(Boolean));
    if(!targetWeekKey || !visibleKeys.has(targetWeekKey)) return;
    const items = sales.filter(function(x){
      if(!x || !x.fecha || (x.cliente||'').trim() !== name) return false;
      const date = new Date(x.fecha);
      return !Number.isNaN(date.getTime()) && weekKey(date) === targetWeekKey;
    });
    if(!items.length) return;
    if(items.every(function(x){return !!x.entregado === desired;})) return;
    try{
      const ids=items.filter(function(x){return !!x.entregado !== desired;}).map(function(x){return x.id;});
      const res=await sb.from('sales').update({entregado:desired}).in('id',ids);
      if(res.error) throw res.error;
      items.forEach(function(x){x.entregado=desired;});
      render();
      if(currentView==='deliveries') renderDeliveriesView();
      showToast(desired?'Pedido marcado como entregado':'Pedido marcado como pendiente de entrega');
    }catch(e){ showToast('No se pudo guardar el estado. Verificá que la migración de Entregas esté aplicada.'); }
  }
  async function toggleDeliveryForClient(name, scope){
    const currentKey=weekKey(new Date());
    const items=(scope==='all' ? sales : salesForWeek(sales,currentKey)).filter(function(x){return (x.cliente||'').trim()===name;}); if(!items.length){showToast('No hay artículos de este cliente en la semana actual.');return;}
    const next=!items.every(function(x){return !!x.entregado;});
    try{
      const ids=items.map(function(x){return x.id;});
      const res=await sb.from('sales').update({entregado:next}).in('id',ids);
      if(res.error) throw res.error;
      items.forEach(function(x){x.entregado=next;}); render();
      if(currentView==='deliveries') renderDeliveriesView();
      showToast(next?'Pedido marcado como entregado':'Pedido marcado como no entregado');
    }catch(e){ showToast('No se pudo guardar el estado de entrega. Aplicá primero la migración SQL incluida en el ZIP.'); }
  }
  function openNewSaleForClient(name){
    editingClientSalesIds = null;
    const openBtn=document.getElementById('openSheet'); if(openBtn) openBtn.click();
    setTimeout(function(){ const field=document.getElementById('fCliente'); if(field){field.value=name;field.dispatchEvent(new Event('input',{bubbles:true}));} },80);
  }
  function openClientSalesEditor(name){
    const clientItems = salesForWeek(sales, weekKey(new Date())).filter(function(x){return (x.cliente||'Sin nombre').trim()===name;}).sort(function(a,b){return new Date(a.fecha)-new Date(b.fecha);});
    if(!clientItems.length){ openNewSaleForClient(name); return; }
    editingClientSalesIds = clientItems.map(function(x){return x.id;});
    editingSaleId = null;
    formState.pagado = clientItems.every(function(x){return !!x.pagado;});
    formState.retira = clientItems.some(function(x){return x.retira==='otro';}) ? 'otro' : 'cliente';
    document.getElementById('fCliente').value = name;
    document.getElementById('fTercero').value = (clientItems.find(function(x){return x.retira==='otro' && x.tercero;})||{}).tercero || '';
    document.querySelectorAll('.pago-opt').forEach(function(b){b.classList.toggle('active',b.dataset.val===(formState.pagado?'1':'0'));});
    document.querySelectorAll('.retira-opt').forEach(function(b){b.classList.toggle('active',b.dataset.val===formState.retira);});
    document.getElementById('terceroField').style.display = formState.retira==='otro' ? 'block' : 'none';
    document.getElementById('itemRowsContainer').innerHTML=''; itemRowCounter=0;
    clientItems.forEach(function(item){addItemRow({articulo:item.articulo,precio:item.precio,categoria:item.categoria},false,item.id);});
    document.getElementById('addItemRowBtn').style.display='block';
    document.getElementById('sheetTitle').textContent='Editar venta · '+name;
    document.getElementById('saveBtnText').textContent='Guardar cambios';
    openSheet();
  }
  document.getElementById('managementSearch').addEventListener('input', function(){renderManagementList(); if(currentView==='deliveries') renderDeliveriesView();});
  document.querySelectorAll('[data-management-filter]').forEach(function(btn){btn.addEventListener('click',function(){managementFilter=btn.dataset.managementFilter;document.querySelectorAll('[data-management-filter]').forEach(function(b){b.classList.toggle('active',b===btn);});renderManagementList();});});

  // Agrupa las ventas de la semana por quién retira realmente (no por
  // artículo), para saber a qué personas hay que entregarles algo,
  // cuánto en total, y si ya está pago o queda debiendo.
  function renderDeliveryList(items){
    let wrap = document.getElementById('deliveryListWrap');
    if(!wrap) return;

    if(!items.length){
      wrap.innerHTML = '<div class="empty-inline">Sin entregas esta semana.</div>';
      return;
    }

    let groups = {};
    items.forEach(function(s){
      let key = s.cliente + '|' + s.retira + '|' + (s.tercero || '');
      if(!groups[key]){
        groups[key] = { cliente: s.cliente, retira: s.retira, tercero: s.tercero, total: 0, pendiente: 0 };
      }
      groups[key].total += Number(s.precio) || 0;
      if(!s.pagado){ groups[key].pendiente += Number(s.precio) || 0; }
    });

    let list = Object.keys(groups).map(function(k){ return groups[k]; });
    list.sort(function(a, b){ return a.cliente.localeCompare(b.cliente, 'es'); });

    let html = '<div class="delivery-list">';
    list.forEach(function(g){
      let displayName = g.retira === 'otro'
        ? escapeHtml(g.tercero) + ' <span class="delivery-forwhom">(' + escapeHtml(g.cliente) + ')</span>'
        : escapeHtml(g.cliente);
      let isPaid = g.pendiente === 0;
      html += '<div class="delivery-item">' +
        '<div class="delivery-info"><div class="delivery-name">' + displayName + '</div></div>' +
        '<div class="delivery-total">' + money(g.total) + '</div>' +
        '<div class="delivery-status ' + (isPaid ? 'paid' : 'pending') + '">' + (isPaid ? 'Pagado' : 'Debe ' + money(g.pendiente)) + '</div>' +
      '</div>';
    });
    html += '</div>';
    wrap.innerHTML = html;
  }

  document.querySelectorAll('.salestab-opt').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.salestab-opt').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      let tab = btn.getAttribute('data-salestab');
      document.getElementById('currentWeekTable').style.display = 'block';
      document.getElementById('deliveryListWrap').style.display = 'none';
    });
  });

  function render(){
    let groups = groupByWeek();
    let keys = Object.keys(groups).sort().reverse();
    let currentKey = weekKey(new Date());

    /* current week: table of articles (shown above the summary) — editable */
    let curItems = (groups[currentKey] || []).slice().sort(function(a,b){ return new Date(b.fecha)-new Date(a.fecha); });
    renderManagementList();
    renderDeliveriesView();
    let deliveryWrap = document.getElementById('deliveryListWrap'); if(deliveryWrap) deliveryWrap.style.display = 'none';

    /* current week: summary ticket, below the table */
    let curStats = weekStats(curItems);
    renderDashboardTasks(curItems);
    document.getElementById('currentTicket').innerHTML =
      '<div class="summary-heading"><div><p class="stat-cards-label">Resumen de la semana</p><p class="summary-period">' + formatRange(currentKey) + '</p></div></div>' +
      '<div class="stat-cards">' +
        '<div class="stat-card primary"><span class="stat-card-icon">💰</span><span class="stat-card-label">Total vendido</span><span class="stat-card-value">' + money(curStats.total) + '</span></div>' +
        '<div class="stat-card success"><span class="stat-card-icon">✅</span><span class="stat-card-label">Cobrado</span><span class="stat-card-value">' + money(curStats.cobrado) + '</span></div>' +
        '<div class="stat-card warning"><span class="stat-card-icon">⏳</span><span class="stat-card-label">Pendiente</span><span class="stat-card-value">' + money(curStats.pendiente) + '</span></div>' +
        '<div class="stat-card"><span class="stat-card-icon">🧾</span><span class="stat-card-label">Artículos</span><span class="stat-card-value">' + curStats.count + '</span></div>' +
      '</div>';

    /* Resumen Semanal: la última semana cerrada, colapsada por defecto. */
    // La semana inmediatamente anterior ya se muestra en Resumen Semanal.
    const summaryWeekKey = previousWeekKey();
    let pastKeys = keys.filter(function(k){ return k !== currentKey && k !== summaryWeekKey; });
    let summaryContent = document.getElementById('weeklySummaryContent');
    let summaryMeta = document.getElementById('weeklySummaryMeta');
    let summaryToggle = document.getElementById('weeklySummaryToggle');
    if(summaryContent && summaryToggle){
      // Mantener el estado de apertura al volver a renderizar (por ejemplo,
      // después de marcar una entrega desde la pantalla Entregas).
      const summaryWasExpanded = !summaryContent.hidden;
      const lastClosedKey = previousWeekKey();
      const lastClosedItems = (groups[lastClosedKey] || []).slice().sort(function(a,b){return new Date(b.fecha)-new Date(a.fecha);});
      if(lastClosedItems.length){
        const lastStats = weekStats(lastClosedItems);
        if(summaryMeta) summaryMeta.textContent = formatRange(lastClosedKey) + ' · ' + lastStats.count + ' artículos · ' + money(lastStats.total);
        summaryContent.innerHTML = renderSalesGroupedByClient(lastClosedItems, 'weekly-summary');
        bindTableEvents(summaryContent);
        summaryContent.hidden = !summaryWasExpanded;
        summaryToggle.setAttribute('aria-expanded',String(summaryWasExpanded));
        summaryToggle.classList.toggle('expanded',summaryWasExpanded);
        summaryToggle.onclick = function(){ const opening=summaryContent.hidden; summaryContent.hidden=!opening; summaryToggle.setAttribute('aria-expanded',String(opening)); summaryToggle.classList.toggle('expanded',opening); };
      }else{
        if(summaryMeta) summaryMeta.textContent = 'No hay ventas registradas en la semana anterior';
        summaryContent.innerHTML = '<div class="empty-inline">El Resumen Semanal muestra únicamente las ventas de la semana inmediatamente anterior.</div>';
        summaryContent.hidden = !summaryWasExpanded;
        summaryToggle.setAttribute('aria-expanded',String(summaryWasExpanded));
        summaryToggle.classList.toggle('expanded',summaryWasExpanded);
        summaryToggle.onclick = function(){ const opening=summaryContent.hidden; summaryContent.hidden=!opening; summaryToggle.setAttribute('aria-expanded',String(opening)); summaryToggle.classList.toggle('expanded',opening); };
      }
      /* No reutilizar semanas históricas más antiguas para este resumen. */
    }
    let container = document.getElementById('weeksContainer');
    if(pastKeys.length === 0){
      container.innerHTML = '<div class="empty"><b>Sin historial todavía</b>Las semanas anteriores van a aparecer acá.</div>';
      renderPeriodComparison();
      renderTopCategoryChart();
      renderTopClients();
      renderClientSearch();
      renderClientsFullList();
      return;
    }
    let html = '';
    pastKeys.slice(0,3).forEach(function(k, historyIndex){
      let st = weekStats(groups[k]);
      let label = "Semana del " + formatRange(k);
      html += '<button type="button" class="week-toggle '+(historyIndex===0?'week-latest':'')+'" data-week="' + k + '" aria-controls="wk-' + k + '" aria-expanded="false">' +
                '<span><span class="lbl">' + label + '</span><br><span class="sub">' + st.count + ' art. · ' + money(st.total) + '</span></span>' +
                '<span class="chev">▾</span>' +
              '</button>';
      // El contenido de la tabla NO se genera acá: se arma recién la
      // primera vez que el usuario abre esta semana (ver más abajo).
      // Con historiales largos, esto evita construir de entrada el HTML
      // de todas las semanas pasadas cuando solo se ve una a la vez.
      html += '<div class="week-items" id="wk-' + k + '" data-loaded="0"></div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('.week-toggle').forEach(function(btn){
      btn.addEventListener('click', function(){
        let wk = btn.getAttribute('data-week');
        let itemsEl = document.getElementById('wk-' + wk);

        if(itemsEl.getAttribute('data-loaded') === '0'){
          let items = groups[wk].slice().sort(function(a,b){ return new Date(b.fecha)-new Date(a.fecha); });
          itemsEl.innerHTML = renderSalesGroupedByClient(items, 'dashboard-history-' + wk);
          bindTableEvents(itemsEl);
          itemsEl.setAttribute('data-loaded', '1');
        }

        const opening = !itemsEl.classList.contains('open');
        btn.classList.toggle('open', opening);
        itemsEl.classList.toggle('open', opening);
        btn.setAttribute('aria-expanded', String(opening));
      });
    });

    renderPeriodComparison();
    renderTopCategoryChart();
    renderTopClients();
    renderClientSearch();
    renderClientsFullList();
  }

  function renderClientSearch(){
    let input = document.getElementById('clientSearch');
    let wrap = document.getElementById('clientSearchResults');
    if(!input || !wrap) return;
    let query = input.value.trim().toLowerCase();
    if(!query){ wrap.innerHTML = ''; return; }

    let thisWeekKey = weekKey(new Date());
    let matches = salesForWeek(sales, thisWeekKey).filter(function(s){
      return (s.cliente || '').toLowerCase().indexOf(query) !== -1;
    });

    if(matches.length === 0){
      wrap.innerHTML = '<div class="empty-inline">Sin ventas de esta semana para ese nombre.</div>';
      return;
    }

    let st = weekStats(matches);
    let owedClass = st.pendiente > 0 ? '' : 'zero';
    let realName = matches[0].cliente; // nombre real tal como se cargó, no lo que se tipeó buscando
    let summaryHtml = '<div class="client-summary">' +
      '<div><div class="name">' + escapeHtml(query) + '</div><div class="owed-label">Debe abonar esta semana</div></div>' +
      '<div class="owed-value ' + owedClass + '">' + money(st.pendiente) + '</div>' +
    '</div>';

    let sorted = matches.slice().sort(function(a,b){ return new Date(b.fecha)-new Date(a.fecha); });
    let shareHtml = '<button type="button" class="save-btn" id="shareReceiptBtn" style="margin-bottom:12px;">📤 Compartir comprobante</button>';
    wrap.innerHTML = summaryHtml + shareHtml + renderSalesTable(sorted, false);
    bindTableEvents(wrap);

    let shareBtn = document.getElementById('shareReceiptBtn');
    if(shareBtn){
      shareBtn.addEventListener('click', function(){ shareReceipt(realName, sorted); });
    }
  }

  function renderClientsFullList(){
    let searchInput = document.getElementById('clientSearch');
    let wrap = document.getElementById('clientsFullList');
    if(!searchInput || !wrap) return;

    if(searchInput.value.trim()){ wrap.innerHTML = ''; return; }

    if(clients.length === 0){
      wrap.innerHTML = '<div class="empty-inline">Todavía no guardaste ningún cliente. Se guardan solos la primera vez que cargués una venta con su nombre.</div>';
      return;
    }

    let sorted = clients.slice().sort(function(a,b){ return a.localeCompare(b, 'es'); });
    let detailPanel = document.getElementById('clientDetailPanel');
    if(detailPanel && wrap.contains(detailPanel)) document.getElementById('viewClients').querySelector('.section-block').appendChild(detailPanel);
    let html = '<div class="client-list">';
    sorted.forEach(function(name){
      html += '<div class="client-row">' +
                '<button type="button" class="client-list-item" data-client-name="' + escapeHtml(name) + '"><span class="client-avatar" aria-hidden="true">' + escapeHtml((name.trim().charAt(0) || 'C').toUpperCase()) + '</span><span class="client-list-copy"><strong>' + escapeHtml(name) + '</strong><small>Ver compras y opciones</small></span><span class="client-row-chevron">›</span></button>' +
                '<div class="client-row-actions"><button type="button" class="client-inline-copy" data-open-messenger="' + escapeHtml(name) + '" aria-label="Abrir Messenger para ' + escapeHtml(name) + '" title="Abrir Messenger"><svg viewBox="0 0 24 24" aria-hidden="true" class="messenger-brand-icon"><path d="M12 2C6.25 2 2 6.13 2 11.45c0 2.98 1.42 5.57 3.65 7.28.19.15.31.4.32.65l.06 2.02c.02.32.35.53.64.41l2.25-.99c.19-.08.39-.1.59-.04.79.22 1.63.34 2.49.34 5.75 0 10-4.13 10-9.45S17.75 2 12 2Zm1.02 12.72-2.55-2.72a.8.8 0 0 0-.96-.15l-3.05 1.63c-.32.17-.66-.2-.44-.49l3.25-4.34a1.2 1.2 0 0 1 1.83-.13l2.55 2.72a.8.8 0 0 0 .96.15l3.05-1.63c.32-.17.66.2.44.49l-3.25 4.34a1.2 1.2 0 0 1-1.83.13Z"/></svg></button><button type="button" class="client-inline-share" data-share-client="' + escapeHtml(name) + '" aria-label="Compartir comprobante de ' + escapeHtml(name) + '" title="Compartir comprobante"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg></button><div class="client-more-wrap"><button type="button" class="client-more-btn" data-client-more="' + escapeHtml(name) + '" aria-label="Más opciones para ' + escapeHtml(name) + '" aria-expanded="false">⋯</button><div class="client-action-menu" data-client-menu="' + escapeHtml(name) + '" hidden><button type="button" data-edit-client="' + escapeHtml(name) + '">✎ Editar nombre</button><button type="button" class="danger" data-del-client="' + escapeHtml(name) + '">⌫ Eliminar de la lista</button></div></div></div>' +
              '</div>';
    });
    html += '</div>';
    wrap.innerHTML = html;
    if(activeClientDetailName) renderClientDetails(activeClientDetailName);

    wrap.querySelectorAll('[data-client-name]').forEach(function(btn){
      btn.addEventListener('click', function(){
        openClientDetails(btn.getAttribute('data-client-name'));
      });
    });
    wrap.querySelectorAll('[data-client-more]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        let name = btn.getAttribute('data-client-more');
        let menu = wrap.querySelector('[data-client-menu="' + CSS.escape(name) + '"]');
        let wasOpen = menu && !menu.hidden;
        wrap.querySelectorAll('.client-action-menu').forEach(function(m){ m.hidden = true; });
        wrap.querySelectorAll('[data-client-more]').forEach(function(b){ b.setAttribute('aria-expanded','false'); });
        if(menu && !wasOpen){ menu.hidden = false; btn.setAttribute('aria-expanded','true'); }
      });
    });
    wrap.querySelectorAll('[data-open-messenger]').forEach(function(btn){
      btn.addEventListener('click', function(){ openMessengerForClientName(btn.getAttribute('data-open-messenger')); });
    });
    wrap.querySelectorAll('[data-share-client]').forEach(function(btn){
      btn.addEventListener('click', function(){
        let name = btn.getAttribute('data-share-client');
        let items = sales.filter(function(s){ return (s.cliente || '') === name; }).sort(function(a,b){ return new Date(b.fecha)-new Date(a.fecha); });
        if(items.length) shareReceipt(name, items); else showToast('Este cliente todavía no tiene ventas registradas.');
      });
    });
    wrap.querySelectorAll('[data-edit-client]').forEach(function(btn){
      btn.addEventListener('click', function(){
        let oldName = btn.getAttribute('data-edit-client');
        let newName = prompt('Editar nombre del cliente:', oldName);
        if(newName === null) return;
        newName = newName.trim();
        if(!newName || newName === oldName) return;
        renameClientEntry(oldName, newName);
      });
    });
    wrap.querySelectorAll('[data-del-client]').forEach(function(btn){
      btn.addEventListener('click', function(){
        let name = btn.getAttribute('data-del-client');
        if(confirm('¿Eliminar a "' + name + '" de tu lista de clientes?\n\nEsto NO borra sus ventas ya registradas, solo lo saca del autocompletado y de esta lista.')){
          deleteClientEntry(name);
        }
      });
    });
  }

  async function openMessengerForClientName(name){
    // Copia el nombre exacto de FeritApp y usa el enlace universal oficial de Messenger.
    // El nombre por sí solo no identifica una conversación concreta; para eso hace falta el enlace del chat/perfil.
    let copied = false;
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(name || '');
        copied = true;
      }
    }catch(e){}
    if(!copied){
      try{
        const field = document.createElement('textarea');
        field.value = name || '';
        field.setAttribute('readonly', '');
        field.style.position = 'fixed'; field.style.opacity = '0'; field.style.pointerEvents = 'none';
        document.body.appendChild(field); field.select();
        copied = document.execCommand('copy');
        document.body.removeChild(field);
      }catch(e){ copied = false; }
    }
    const ua = navigator.userAgent || '';
    showToast((copied ? 'Nombre copiado. ' : 'Intentá copiar el nombre manualmente. ') + 'Abriendo Messenger…');
    // Android Chrome: el intent incluye URL HTTPS para que el sistema resuelva la app instalada.
    // iOS y navegadores integrados: usar el universal link oficial de Messenger.
    const target = /Android/i.test(ua)
      ? 'intent://m.me/#Intent;scheme=https;package=com.facebook.orca;S.browser_fallback_url=https%3A%2F%2Fm.me%2F;end'
      : 'https://m.me/';
    try{
      window.location.assign(target);
    }catch(e){
      showToast('No se pudo abrir Messenger desde este navegador. El nombre quedó copiado si el permiso lo permitió.');
    }
  }

  function openClientDetails(name){
    switchView('sales');
    const input=document.getElementById('managementSearch'); if(input) input.value=name;
    managementFilter='all'; document.querySelectorAll('[data-management-filter]').forEach(function(b){b.classList.toggle('active',b.dataset.managementFilter==='all');});
    renderManagementList();
    setTimeout(function(){ const btn=Array.from(document.querySelectorAll('#currentWeekTable [data-sales-group]')).find(function(b){return b.textContent.includes(name);}); if(btn && btn.getAttribute('aria-expanded')!=='true') btn.click(); if(btn) btn.scrollIntoView({behavior:'smooth',block:'center'}); },60);
  }

  function renderClientDetails(name){
    let panel = document.getElementById('clientDetailPanel');
    if(!panel) return;
    if(!name){ panel.hidden = true; panel.innerHTML=''; return; }
    // La ficha de cliente muestra únicamente compras de la semana configurada como actual.
    let thisWeekKey = weekKey(new Date());
    let items = salesForWeek(sales, thisWeekKey).filter(function(s){
      return (s.cliente || '') === name;
    }).sort(function(a,b){ return new Date(b.fecha)-new Date(a.fecha); });
    let total = items.reduce(function(sum,s){ return sum + (Number(s.precio)||0); },0);
    panel.hidden = false;
    let rows = items.map(function(s){
      let date = s.fecha ? new Date(s.fecha).toLocaleDateString('es-AR',{day:'2-digit',month:'short',year:'numeric'}) : '';
      return '<div class="client-purchase-row"><div class="client-purchase-main"><strong>' + escapeHtml(s.articulo || 'Artículo') + '</strong><small>' + escapeHtml(date) + '</small></div><span class="client-purchase-price">' + money(s.precio) + '</span></div>';
    }).join('');
    panel.innerHTML = '<div class="client-detail-head"><div><p class="view-hero-kicker">DETALLE DEL CLIENTE</p><h3>' + escapeHtml(name) + '</h3><p class="client-detail-sub">' + items.length + ' artículos esta semana</p></div><button type="button" class="client-detail-close" data-close-client-detail aria-label="Cerrar detalle">×</button></div>' +
      '<div class="client-detail-total"><span>Total de compras de esta semana</span><strong>' + money(total) + '</strong></div>' +
      '<div class="client-purchase-list">' + (rows || '<div class="empty-inline">Este cliente no tiene compras registradas en la semana actual.</div>') + '</div>' +
      '<div class="client-detail-actions"><button type="button" class="copy-client-name-btn" data-open-messenger="' + escapeHtml(name) + '"><svg viewBox="0 0 24 24" aria-hidden="true" class="messenger-brand-icon"><path d="M12 2C6.25 2 2 6.13 2 11.45c0 2.98 1.42 5.57 3.65 7.28.19.15.31.4.32.65l.06 2.02c.02.32.35.53.64.41l2.25-.99c.19-.08.39-.1.59-.04.79.22 1.63.34 2.49.34 5.75 0 10-4.13 10-9.45S17.75 2 12 2Zm1.02 12.72-2.55-2.72a.8.8 0 0 0-.96-.15l-3.05 1.63c-.32.17-.66-.2-.44-.49l3.25-4.34a1.2 1.2 0 0 1 1.83-.13l2.55 2.72a.8.8 0 0 0 .96.15l3.05-1.63c.32-.17.66.2.44.49l-3.25 4.34a1.2 1.2 0 0 1-1.83.13Z"/></svg> Abrir Messenger</button><button type="button" class="share-client-btn" data-share-client="' + escapeHtml(name) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3m-5 5 5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg> Compartir comprobante</button></div>';
    const clientRow=document.querySelector('#clientsFullList [data-client-name=\"'+CSS.escape(name)+'\"]')?.closest('.client-row');
    if(clientRow && panel.parentElement !== clientRow) clientRow.insertAdjacentElement('afterend', panel);
    panel.querySelector('[data-close-client-detail]').addEventListener('click', function(){ activeClientDetailName=''; renderClientDetails(''); });
    panel.querySelector('[data-open-messenger]').addEventListener('click', function(){ openMessengerForClientName(name); });
    panel.querySelector('[data-share-client]').addEventListener('click', function(){ if(items.length) shareReceipt(name, items); else showToast('Este cliente todavía no tiene ventas registradas.'); });
  }

  document.addEventListener('click', function(e){
    let link = e.target.closest('[data-client-link]');
    if(link){ e.preventDefault(); openClientDetails(link.getAttribute('data-client-link')); }
  });

  async function renameClientEntry(oldName, newName){
    let collision = clients.some(function(c){
      return c.toLowerCase() === newName.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase();
    });

    try{
      if(collision){
        // Ya existe un cliente con ese nombre: fusiono en vez de duplicar.
        // Sus ventas pasan a quedar unificadas bajo el nombre existente,
        // y se borra la entrada vieja de la lista de clientes.
        await sb.from('clients').delete().eq('name', oldName);
        clients = clients.filter(function(c){ return c.toLowerCase() !== oldName.toLowerCase(); });
      }else{
        await sb.from('clients').update({ name: newName }).eq('name', oldName);
        clients = clients.map(function(c){ return c.toLowerCase() === oldName.toLowerCase() ? newName : c; });
      }

      await sb.from('sales').update({ cliente: newName }).eq('cliente', oldName);
      sales.forEach(function(s){ if(s.cliente === oldName){ s.cliente = newName; } });

      refreshClientsDatalist();
      document.getElementById('clientSearch').value = '';
      render();
      showToast(collision ? 'Cliente fusionado con "' + newName + '"' : 'Cliente actualizado');
    }catch(e){
      showToast('No se pudo actualizar el cliente.');
    }
  }

  async function deleteClientEntry(name){
    const removed=clients.filter(function(c){return c.toLowerCase()===name.toLowerCase();});
    if(!removed.length){showToast('No se encontró el cliente en la lista.');return;}
    clients=clients.filter(function(c){return c.toLowerCase()!==name.toLowerCase();});
    refreshClientsDatalist(); renderClientsFullList();
    scheduleUndoableDeletion({
      message:'Cliente quitado de la lista. Podés deshacer',
      undo:function(){clients=clients.concat(removed);refreshClientsDatalist();renderClientsFullList();},
      commit:async function(){const result=await sb.from('clients').delete().eq('name',name);if(result.error)throw result.error;}
    });
  }

  let clientSearchDebounce = null;
  document.getElementById('clientSearch').addEventListener('input', function(){
    clearTimeout(clientSearchDebounce);
    clientSearchDebounce = setTimeout(function(){
      renderClientSearch();
      renderClientsFullList();
    }, 150);
  });

  function escapeHtml(str){
    let d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function showToast(msg, duration){
    let t = document.getElementById('toast');
    t.classList.remove('has-action');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function(){ if(!t.classList.contains('has-action')) t.classList.remove('show'); }, duration || 2200);
  }

  /* ---------------- sheet open/close ---------------- */
  function openSheet(){
    const title = document.getElementById('sheetTitle');
    const titleText = title ? title.textContent.trim().toLowerCase() : '';
    sheet.classList.toggle('new-sale-mode', titleText === 'nueva venta');
    // V12.61: reutiliza la presentación de formulario en la edición agrupada
    // de una venta del cliente, sin afectar la edición individual de artículos.
    sheet.classList.toggle('edit-sale-mode', titleText.indexOf('editar venta') === 0);
    sheet.classList.add('open'); scrim.classList.add('open');
  }
  function closeSheet(){
    sheet.classList.remove('open'); scrim.classList.remove('open');
    editingClientSalesIds = null;
    resetForm();
  }
  document.getElementById('openSheet').addEventListener('click', openSheet);
  document.getElementById('sidebarOpenSheet').addEventListener('click', openSheet);
  scrim.addEventListener('click', closeSheet);
  // V12.56 — cerrar Nueva/Editar Venta con un gesto vertical corto y controlado.
  (function enableSheetSwipeToClose(){
    let startX=0,startY=0,lastY=0,tracking=false,dragging=false;
    const handle=sheet.querySelector('.sheet-handle');
    function onStart(e){
      if(!sheet.classList.contains('open') || !e.touches || e.touches.length!==1) { tracking=false; return; }
      const t=e.touches[0], rect=sheet.getBoundingClientRect();
      const inGrip=(handle && handle.contains(e.target)) || (t.clientY < rect.top+64 && !e.target.closest('input,textarea,select,button'));
      tracking=!!inGrip && sheet.scrollTop<=2; dragging=false;
      startX=t.clientX; startY=t.clientY; lastY=t.clientY;
    }
    function onMove(e){
      if(!tracking || !e.touches || !e.touches.length) return;
      const t=e.touches[0],dx=t.clientX-startX,dy=t.clientY-startY; lastY=t.clientY;
      if(Math.abs(dx)>Math.abs(dy)*1.1){tracking=false;return;}
      if(dy>12 && sheet.scrollTop<=2) dragging=true;
    }
    function onEnd(e){
      if(!tracking){dragging=false;return;}
      const t=e.changedTouches&&e.changedTouches[0];
      if(t){const dx=t.clientX-startX,dy=t.clientY-startY;
        if(dragging && dy>68 && Math.abs(dx)<70 && sheet.scrollTop<=2) closeSheet();
      }
      tracking=false;dragging=false;
    }
    sheet.addEventListener('touchstart',onStart,{passive:true});
    sheet.addEventListener('touchmove',onMove,{passive:true});
    sheet.addEventListener('touchend',onEnd,{passive:true});
    sheet.addEventListener('touchcancel',function(){tracking=false;dragging=false;},{passive:true});
  })();

  const sheetTitle = document.getElementById('sheetTitle');
  if(sheetTitle && !document.getElementById('closeSaleSheetBtn')){
    const titleRow=document.createElement('div'); titleRow.className='sheet-title-row';
    sheetTitle.parentNode.insertBefore(titleRow,sheetTitle); titleRow.appendChild(sheetTitle);
    const closeBtn=document.createElement('button'); closeBtn.type='button'; closeBtn.id='closeSaleSheetBtn'; closeBtn.className='sheet-close-btn'; closeBtn.setAttribute('aria-label','Cerrar formulario de venta'); closeBtn.textContent='✕';
    closeBtn.addEventListener('click',closeSheet); titleRow.appendChild(closeBtn);
  }

  /* ---------------- form state ---------------- */
  let formState = { pagado: false, retira: 'cliente' };
  let editingSaleId = null;
  let editingClientSalesIds = null;
  let itemRowCounter = 0;

  function categoryOptionsHtml(selected){
    return categories.map(function(c){
      let sel = (c === selected) ? ' selected' : '';
      return '<option value="' + escapeHtml(c) + '"' + sel + '>' + escapeHtml(c) + '</option>';
    }).join('');
  }

  function addItemRow(prefill, isOriginal, existingSaleId){
    itemRowCounter++;
    let rowId = 'row' + itemRowCounter;
    let container = document.getElementById('itemRowsContainer');
    let defaultCat = (prefill && prefill.categoria) || (categories.length ? categories[0] : '');

    let html =
      '<div class="item-row" data-row-id="' + rowId + '"' + (isOriginal ? ' data-original="1"' : '') + (existingSaleId ? ' data-sale-id="' + escapeHtml(existingSaleId) + '"' : '') + '>' +
        '<div class="item-row-header">' +
          '<span class="item-row-label">Artículo</span>' +
          '<button type="button" class="item-row-del" data-del-row="' + rowId + '">✕ Quitar</button>' +
        '</div>' +
        '<label class="item-field item-field-name"><span>Nombre del artículo</span><div class="input-row">' +
          '<input type="text" class="row-articulo" aria-label="Nombre del artículo" placeholder="Ej: remera azul talle M" value="' + (prefill ? escapeHtml(prefill.articulo) : '') + '">' +
          '<button class="mic-btn" type="button" data-row="' + rowId + '" data-field="articulo" data-mode="text" aria-label="Dictar artículo"><svg class="mic-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/></svg></button>' +
        '</div></label>' +
        '<label class="item-field item-field-price"><span>Precio</span><div class="input-row">' +
          '<input type="number" class="row-precio" aria-label="Precio del artículo" placeholder="$ 0" inputmode="decimal" value="' + (prefill ? prefill.precio : '') + '">' +
          '<button class="mic-btn" type="button" data-row="' + rowId + '" data-field="precio" data-mode="number" aria-label="Dictar precio"><svg class="mic-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/></svg></button>' +
        '</div></label>' +
        '<label class="item-field item-field-category"><span>Categoría</span><select class="row-categoria" aria-label="Categoría del artículo">' + categoryOptionsHtml(defaultCat) + '</select></label>' +
      '</div>';

    container.insertAdjacentHTML('beforeend', html);
    let rowEl = container.querySelector('[data-row-id="' + rowId + '"]');

    rowEl.querySelectorAll('.mic-btn').forEach(function(btn){
      btn.addEventListener('click', function(){ startDictation(btn); });
    });
    if(!voiceSupported){
      rowEl.querySelectorAll('.mic-btn').forEach(function(b){ b.style.display = 'none'; });
    }
    rowEl.querySelector('.row-precio').addEventListener('input', updateItemsTotal);
    rowEl.querySelector('.row-articulo').addEventListener('input', updateItemsTotal);
    rowEl.querySelector('.item-row-del').addEventListener('click', function(){
      rowEl.remove();
      updateItemsTotal();
      updateItemRowLabels();
    });

    updateItemsTotal();
    updateItemRowLabels();
  }

  function updateItemRowLabels(){
    let rows = document.querySelectorAll('#itemRowsContainer .item-row');
    rows.forEach(function(r, idx){
      r.querySelector('.item-row-label').textContent = 'Artículo ' + (idx + 1);
      let del = r.querySelector('.item-row-del');
      // En edición masiva se pueden quitar artículos existentes; al guardar se eliminan.
      del.style.display = (rows.length <= 1 && !editingClientSalesIds) ? 'none' : 'inline-block';
    });
  }

  function updateItemsTotal(){
    let total = 0;
    document.querySelectorAll('#itemRowsContainer .row-precio').forEach(function(inp){
      let v = parseFloat(inp.value);
      if(!isNaN(v)) total += v;
    });
    let totalText = money(total);
    let el = document.getElementById('itemsTotalValue');
    if(el) el.textContent = totalText;
    let footerEl = document.getElementById('sheetFooterTotal');
    if(footerEl) footerEl.textContent = totalText;
    const footerBar = document.querySelector('#sheet .sheet-save-bar');
    if(footerBar){
      const hasCompleteItem = Array.from(document.querySelectorAll('#itemRowsContainer .item-row')).some(function(row){
        const name = (row.querySelector('.row-articulo') || {}).value || '';
        const rawPrice = (row.querySelector('.row-precio') || {}).value;
        const price = parseFloat(rawPrice);
        return name.trim().length > 0 && Number.isFinite(price) && price > 0;
      });
      footerBar.classList.toggle('is-empty', !hasCompleteItem);
      footerBar.setAttribute('aria-hidden', hasCompleteItem ? 'false' : 'true');
    }
  }

  function refreshAllRowCategorySelects(){
    document.querySelectorAll('#itemRowsContainer .row-categoria').forEach(function(sel){
      let current = sel.value;
      sel.innerHTML = categoryOptionsHtml(current || (categories.length ? categories[0] : ''));
    });
  }

  document.getElementById('addItemRowBtn').addEventListener('click', function(){ addItemRow(); });

  function resetForm(){
    document.getElementById('fCliente').value = '';
    document.getElementById('fTercero').value = '';
    formState.pagado = false; formState.retira = 'cliente';
    document.querySelectorAll('.pago-opt').forEach(function(b){ b.classList.toggle('active', b.dataset.val === '0'); });
    document.querySelectorAll('.retira-opt').forEach(function(b){ b.classList.toggle('active', b.dataset.val === 'cliente'); });
    document.getElementById('terceroField').style.display = 'none';
    document.getElementById('newCatRow').style.display = 'none';
    document.getElementById('fNuevaCategoria').value = '';

    document.getElementById('itemRowsContainer').innerHTML = '';
    itemRowCounter = 0;
    addItemRow();
    document.getElementById('addItemRowBtn').style.display = 'block';

    editingSaleId = null;
    document.getElementById('sheetTitle').textContent = 'Nueva venta';
    sheet.classList.add('new-sale-mode');
    sheet.classList.remove('edit-sale-mode');
    document.getElementById('saveBtnText').textContent = 'Guardar venta';
  }

  function openEditSheet(item){
    editingClientSalesIds = null;
    editingSaleId = item.id;
    document.getElementById('fCliente').value = item.cliente;
    document.getElementById('fTercero').value = item.tercero || '';

    formState.pagado = !!item.pagado;
    formState.retira = item.retira === 'otro' ? 'otro' : 'cliente';

    document.querySelectorAll('.pago-opt').forEach(function(b){ b.classList.toggle('active', b.dataset.val === (formState.pagado ? '1' : '0')); });
    document.querySelectorAll('.retira-opt').forEach(function(b){ b.classList.toggle('active', b.dataset.val === formState.retira); });
    document.getElementById('terceroField').style.display = (formState.retira === 'otro') ? 'block' : 'none';

    // El artículo que se está editando queda marcado como fila "original"
    // (no se puede quitar desde acá). Pero SÍ se pueden agregar más
    // artículos nuevos para el mismo cliente en la misma edición.
    document.getElementById('itemRowsContainer').innerHTML = '';
    itemRowCounter = 0;
    addItemRow({ articulo: item.articulo, precio: item.precio, categoria: item.categoria }, true);
    document.getElementById('addItemRowBtn').style.display = 'block';

    document.getElementById('sheetTitle').textContent = 'Editar artículo';
    sheet.classList.remove('new-sale-mode');
    document.getElementById('saveBtnText').textContent = 'Guardar cambios';

    openSheet();
  }

  document.getElementById('openNewCatBtn').addEventListener('click', function(){
    let row = document.getElementById('newCatRow');
    row.style.display = (row.style.display === 'none') ? 'flex' : 'none';
    if(row.style.display === 'flex'){ document.getElementById('fNuevaCategoria').focus(); }
  });

  document.getElementById('confirmNewCat').addEventListener('click', async function(){
    let input = document.getElementById('fNuevaCategoria');
    let name = input.value.trim();
    if(!name){ showToast('Escribí un nombre para la categoría'); return; }
    let exists = categories.some(function(c){ return c.toLowerCase() === name.toLowerCase(); });
    if(!exists){
      await persistNewCategory(name);
      categories.push(name);
    }
    input.value = '';
    document.getElementById('newCatRow').style.display = 'none';
    refreshAllRowCategorySelects();
    showToast('Categoría creada');
  });

  document.querySelectorAll('.pago-opt').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.pago-opt').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      formState.pagado = btn.dataset.val === '1';
    });
  });
  document.querySelectorAll('.retira-opt').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.retira-opt').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      formState.retira = btn.dataset.val;
      document.getElementById('terceroField').style.display = (formState.retira === 'otro') ? 'block' : 'none';
    });
  });

  document.getElementById('saveBtn').addEventListener('click', async function(){
    let cliente = document.getElementById('fCliente').value.trim();
    let tercero = document.getElementById('fTercero').value.trim();

    if(!cliente){ showToast('Falta el nombre del cliente'); return; }
    if(formState.retira === 'otro' && !tercero){ showToast('Falta el nombre de quien retira'); return; }

    let rowEls = document.querySelectorAll('#itemRowsContainer .item-row');
    if(rowEls.length === 0){ showToast('Agregá al menos un artículo'); return; }

    let items = [];
    for(let i = 0; i < rowEls.length; i++){
      let articulo = rowEls[i].querySelector('.row-articulo').value.trim();
      let precio = parseFloat(rowEls[i].querySelector('.row-precio').value);
      let categoria = rowEls[i].querySelector('.row-categoria').value || 'Sin categoría';
      if(!articulo){ showToast('Falta el nombre del artículo ' + (i + 1)); return; }
      if(isNaN(precio) || precio <= 0){ showToast('Precio inválido en el artículo ' + (i + 1)); return; }
      items.push({ articulo: articulo, precio: precio, categoria: categoria });
    }

    let saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;

    try{
      if(editingClientSalesIds){
        const rows = Array.from(rowEls);
        const existingIds = editingClientSalesIds.slice();
        const keptIds = rows.map(function(row){return row.getAttribute('data-sale-id');}).filter(Boolean);
        const removedIds = existingIds.filter(function(id){return !keptIds.includes(id);});
        for(let i=0;i<rows.length;i++){
          const rowId = rows[i].getAttribute('data-sale-id');
          const it = items[i];
          const saleData = {cliente:cliente, articulo:it.articulo, precio:it.precio, pagado:formState.pagado, retira:formState.retira, tercero:formState.retira==='otro'?tercero:'', categoria:it.categoria};
          if(rowId){
            const upd = await sb.from('sales').update(saleData).eq('id',rowId).select();
            if(upd.error) throw upd.error;
            const idx = sales.findIndex(function(x){return x.id===rowId;});
            if(idx!==-1 && upd.data && upd.data[0]) sales[idx]=mapRowToSale(upd.data[0]);
          }else{
            const ins = await sb.from('sales').insert(saleData).select();
            if(ins.error) throw ins.error;
            ins.data.forEach(function(row){sales.unshift(mapRowToSale(row));});
          }
        }
        if(removedIds.length){
          const removedSales=sales.filter(function(x){return removedIds.includes(x.id);});
          sales=sales.filter(function(x){return !removedIds.includes(x.id);});
          scheduleUndoableDeletion({
            message:(removedSales.length===1?'Artículo quitado.':'Artículos quitados: '+removedSales.length+'.')+' Podés deshacer',
            undo:function(){sales=sales.concat(removedSales);},
            commit:async function(){
              const delRes=await sb.from('sales').delete().in('id',removedIds);
              if(delRes.error)throw delRes.error;
            }
          });
        }
        editingClientSalesIds = null;
        await persistClientIfNew(cliente);
        render(); closeSheet(); showToast('Venta actualizada');
      }else if(editingSaleId){
        let saleData = {
          cliente: cliente,
          articulo: items[0].articulo,
          precio: items[0].precio,
          pagado: formState.pagado,
          retira: formState.retira,
          tercero: formState.retira === 'otro' ? tercero : '',
          categoria: items[0].categoria
        };
        let updRes = await sb.from('sales').update(saleData).eq('id', editingSaleId).select();
        if(updRes.error) throw updRes.error;
        let idx = sales.findIndex(function(s){ return s.id === editingSaleId; });
        if(idx !== -1){ sales[idx] = mapRowToSale(updRes.data[0]); }

        // Artículos extra agregados durante esta edición (además del que
        // se estaba corrigiendo) se guardan como ventas nuevas del mismo cliente.
        let extraCount = 0;
        if(items.length > 1){
          let extraBatch = items.slice(1).map(function(it){
            return {
              cliente: cliente,
              articulo: it.articulo,
              precio: it.precio,
              pagado: formState.pagado,
              retira: formState.retira,
              tercero: formState.retira === 'otro' ? tercero : '',
              categoria: it.categoria
            };
          });
          let extraRes = await sb.from('sales').insert(extraBatch).select();
          if(extraRes.error) throw extraRes.error;
          extraRes.data.forEach(function(row){ sales.unshift(mapRowToSale(row)); });
          extraCount = extraRes.data.length;
        }

        await persistClientIfNew(cliente);
        render();
        closeSheet();
        showToast(extraCount > 0 ? 'Actualizado, y ' + extraCount + ' artículo(s) nuevo(s) agregado(s)' : 'Artículo actualizado');
      }else{
        let batch = items.map(function(it){
          return {
            cliente: cliente,
            articulo: it.articulo,
            precio: it.precio,
            pagado: formState.pagado,
            retira: formState.retira,
            tercero: formState.retira === 'otro' ? tercero : '',
            categoria: it.categoria
          };
        });
        let res = await sb.from('sales').insert(batch).select();
        if(res.error) throw res.error;
        res.data.forEach(function(row){ sales.unshift(mapRowToSale(row)); });
        await persistClientIfNew(cliente);
        render();
        closeSheet();
        showToast(items.length > 1 ? items.length + ' artículos guardados' : 'Venta guardada');
      }
    }catch(e){
      showToast('No se pudo guardar. Probá de nuevo.');
    }finally{
      saveBtn.disabled = false;
    }
  });

  /* ---------------- reset all ---------------- */
  function handleManualExport(){
    if(sales.length === 0){ showToast('No hay ventas para exportar.'); return; }
    let today = new Date().toISOString().slice(0,10);
    exportSalesToCSV(sales, 'feritapp-historial-completo-' + today + '.csv');
    showToast('CSV descargado');
  }
  document.getElementById('exportCsvBtn').addEventListener('click', handleManualExport);

  document.getElementById('changePasswordBtn').addEventListener('click', async function(){
    let current = document.getElementById('profileCurrentPin').value;
    let newPin = document.getElementById('profileNewPin').value;
    let newPinConfirm = document.getElementById('profileNewPinConfirm').value;
    let err = document.getElementById('profilePwError');
    err.style.display = 'none';

    if(!current){ err.textContent = 'Ingresá tu contraseña actual.'; err.style.display = 'block'; return; }
    if(!isValidPassword(newPin)){ err.textContent = 'La nueva contraseña necesita mínimo 6 caracteres, con una mayúscula, un número y un símbolo.'; err.style.display = 'block'; return; }
    if(newPin !== newPinConfirm){ err.textContent = 'Las contraseñas nuevas no coinciden.'; err.style.display = 'block'; return; }
    if(!currentUserEmail){ err.textContent = 'No se pudo identificar tu cuenta, volvé a iniciar sesión.'; err.style.display = 'block'; return; }

    let btn = document.getElementById('changePasswordBtn');
    btn.disabled = true;

    // Antes de cambiarla, reverifico que la contraseña actual sea correcta
    // (por si alguien deja el celu desbloqueado con la sesión abierta).
    let verifyRes = await sb.auth.signInWithPassword({ email: currentUserEmail, password: current });
    if(verifyRes.error){
      err.textContent = 'La contraseña actual no es correcta.';
      err.style.display = 'block';
      btn.disabled = false;
      return;
    }

    let updRes = await sb.auth.updateUser({ password: newPin });
    btn.disabled = false;

    if(updRes.error){
      err.textContent = 'No se pudo actualizar la contraseña: ' + updRes.error.message;
      err.style.display = 'block';
      return;
    }

    document.getElementById('profileCurrentPin').value = '';
    document.getElementById('profileNewPin').value = '';
    document.getElementById('profileNewPinConfirm').value = '';
    showToast('Contraseña actualizada');
  });

  document.getElementById('resetBtn').addEventListener('click', async function(){
    if(!confirm('¿Quitar todo el historial de ventas? Vas a tener 10 segundos para deshacerlo.')) return;
    const previousSales=sales.slice();
    if(!previousSales.length){showToast('No hay ventas para eliminar.');return;}
    sales=[];
    render();
    scheduleUndoableDeletion({
      message:'Historial quitado. Podés deshacer',
      undo:function(){sales=sales.concat(previousSales);},
      commit:async function(){
        const result=await sb.from('sales').delete().neq('id','00000000-0000-0000-0000-000000000000');
        if(result.error)throw result.error;
      }
    });
  });

  /* ---------------- voice dictation ---------------- */
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const voiceSupported = !!SpeechRec;
  if(!voiceSupported){
    document.getElementById('voiceWarning').innerHTML =
      '<div class="voice-warning">El dictado por voz no está disponible en este navegador. Probá abrir la app con Chrome en Android para usar el micrófono, o cargá los datos escribiendo directamente.</div>';
    document.querySelectorAll('.mic-btn').forEach(function(b){ b.style.display = 'none'; });
  }

  const NUM_WORDS = {
    'cero':0,'un':1,'uno':1,'una':1,'dos':2,'tres':3,'cuatro':4,'cinco':5,'seis':6,'siete':7,'ocho':8,'nueve':9,
    'diez':10,'once':11,'doce':12,'trece':13,'catorce':14,'quince':15,'dieciseis':16,'diecisiete':17,'dieciocho':18,'diecinueve':19,
    'veinte':20,'veintiun':21,'veintiuno':21,'veintidos':22,'veintitres':23,'veinticuatro':24,'veinticinco':25,'veintiseis':26,'veintisiete':27,'veintiocho':28,'veintinueve':29,
    'treinta':30,'cuarenta':40,'cincuenta':50,'sesenta':60,'setenta':70,'ochenta':80,'noventa':90,
    'cien':100,'ciento':100,'doscientos':200,'doscientas':200,'trescientos':300,'trescientas':300,
    'cuatrocientos':400,'cuatrocientas':400,'quinientos':500,'quinientas':500,'seiscientos':600,'seiscientas':600,
    'setecientos':700,'setecientas':700,'ochocientos':800,'ochocientas':800,'novecientos':900,'novecientas':900
  };
  function stripAccents(s){
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }
  function wordsToNumber(text){
    let clean = stripAccents(text.toLowerCase())
      .replace(/pesos|peso|con\s*\d+\s*centavos?/g, ' ')
      .replace(/[^a-z0-9\s]/g,' ');
    let words = clean.split(/\s+/).filter(Boolean);
    let total = 0, current = 0, found = false;
    words.forEach(function(w){
      if(/^\d+$/.test(w)){ current += parseInt(w,10); found = true; return; }
      if(w in NUM_WORDS){ current += NUM_WORDS[w]; found = true; return; }
      if(w === 'mil'){ current = (current === 0 ? 1 : current) * 1000; total += current; current = 0; found = true; return; }
      if(w === 'millon' || w === 'millones'){ current = (current === 0 ? 1 : current) * 1000000; total += current; current = 0; found = true; return; }
      // ignore filler words like "y", "de"
    });
    total += current;
    return found ? total : null;
  }
  function extractPrice(transcript){
    let digitMatch = transcript.replace(/[.,](?=\d{3}\b)/g,'').match(/\d+/g);
    if(digitMatch){
      // Tomamos solo el primer grupo de dígitos (no los concatenamos todos).
      // Si se concatenaran, un decimal accidental (ej: "1500.50" -> ["1500","50"])
      // o un doble dictado por ruido terminarían formando un precio absurdo
      // como 150050 en vez de 1500.
      return parseInt(digitMatch[0], 10);
    }
    return wordsToNumber(transcript);
  }

  function resolveDictationInput(btn){
    let targetId = btn.getAttribute('data-target');
    if(targetId){ return document.getElementById(targetId); }
    let rowId = btn.getAttribute('data-row');
    let field = btn.getAttribute('data-field');
    if(rowId && field){
      let rowEl = document.querySelector('[data-row-id="' + rowId + '"]');
      if(rowEl){ return rowEl.querySelector('.row-' + field); }
    }
    return null;
  }

  function startDictation(btn){
    if(!voiceSupported) return;
    let mode = btn.getAttribute('data-mode');
    let input = resolveDictationInput(btn);
    if(!input) return;

    let recognition = new SpeechRec();
    recognition.lang = 'es-AR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    btn.classList.add('listening');

    recognition.onresult = function(event){
      let transcript = event.results[0][0].transcript;
      if(mode === 'number'){
        let parsed = extractPrice(transcript);
        if(parsed !== null){
          input.value = parsed;
        }else{
          showToast('No entendí el número, escribilo manualmente');
        }
      }else{
        let cap = transcript.charAt(0).toUpperCase() + transcript.slice(1);
        input.value = cap;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    recognition.onerror = function(event){
      if(event.error === 'not-allowed' || event.error === 'permission-denied'){
        showToast('Permiso de micrófono denegado');
      }else if(event.error === 'no-speech'){
        showToast('No se detectó voz, intentá de nuevo');
      }
    };
    recognition.onend = function(){
      btn.classList.remove('listening');
    };
    try{ recognition.start(); }catch(e){ btn.classList.remove('listening'); }
  }

  document.querySelectorAll('.mic-btn').forEach(function(btn){
    btn.addEventListener('click', function(){ startDictation(btn); });
  });

  /* ---------------- mostrar / ocultar contraseña ---------------- */
  document.querySelectorAll('.pw-toggle-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      let input = document.getElementById(btn.getAttribute('data-target'));
      if(!input) return;
      let showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.textContent = showing ? '👁' : '🙈';
      btn.classList.toggle('showing', !showing);
      btn.setAttribute('aria-label', showing ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
  });

  /* ---------------- init ---------------- */
  /* ---------------- tema: claro / oscuro / sistema ---------------- */
  const THEME_KEY = 'feritapp-theme';

  function resolveIsDark(choice){
    if(choice === 'dark') return true;
    if(choice === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function applyTheme(choice){
    let isDark = resolveIsDark(choice);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    document.querySelectorAll('.theme-opt').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-theme-choice') === choice);
    });
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if(themeColorMeta){ themeColorMeta.setAttribute('content', isDark ? '#14101f' : '#7c3aed'); }
  }

  function setTheme(choice){
    try{ localStorage.setItem(THEME_KEY, choice); }catch(e){}
    applyTheme(choice);
  }

  document.querySelectorAll('.theme-opt').forEach(function(btn){
    btn.addEventListener('click', function(){ setTheme(btn.getAttribute('data-theme-choice')); });
  });

  if(window.matchMedia){
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(){
      let current = 'system';
      try{ current = localStorage.getItem(THEME_KEY) || 'system'; }catch(e){}
      if(current === 'system'){ applyTheme('system'); }
    });
  }

  (function initTheme(){
    let saved = 'system';
    try{ saved = localStorage.getItem(THEME_KEY) || 'system'; }catch(e){}
    applyTheme(saved);
  })();

  /* ---------------- accesibilidad: tamaño global de letra ---------------- */
  const FONT_SCALE_KEY = 'feritapp-font-scale';
  const FONT_SCALE_PRESETS = ['0.9','1','1.15','1.3','1.5'];

  function applyFontScale(value){
    const scale = FONT_SCALE_PRESETS.includes(String(value)) ? String(value) : '1';
    document.documentElement.style.setProperty('--font-scale', scale);
    document.querySelectorAll('[data-font-scale]').forEach(function(btn){
      const selected = btn.getAttribute('data-font-scale') === scale;
      btn.classList.toggle('active', selected);
      btn.setAttribute('aria-pressed', String(selected));
    });
    const label = document.getElementById('fontScaleLabel');
    if(label) label.textContent = 'Tamaño actual: ' + Math.round(Number(scale) * 100) + '%';
  }

  function setFontScale(value){
    const scale = FONT_SCALE_PRESETS.includes(String(value)) ? String(value) : '1';
    try{ localStorage.setItem(FONT_SCALE_KEY, scale); }catch(e){}
    applyFontScale(scale);
  }

  document.querySelectorAll('.font-scale-option').forEach(function(btn){
    btn.addEventListener('click', function(){ setFontScale(btn.getAttribute('data-font-scale')); });
  });
  const resetFontScaleBtn = document.getElementById('resetFontScale');
  if(resetFontScaleBtn) resetFontScaleBtn.addEventListener('click', function(){ setFontScale('1'); });
  (function initFontScale(){
    let saved = '1';
    try{ saved = localStorage.getItem(FONT_SCALE_KEY) || '1'; }catch(e){}
    applyFontScale(saved);
  })();

  initGate();

  /* ---------------- PWA: registrar service worker ---------------- */
  if('serviceWorker' in navigator){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').catch(function(){ /* si falla, la app sigue funcionando igual */ });
    });
  }

  /* ---------------- PWA: banner propio de instalación ---------------- */
  const installBanner = document.getElementById('installBanner');
  const menuInstallBtn = document.getElementById('menuInstallBtn');
  let deferredInstallPrompt = null;

  function showInstallBanner(){
    if(localStorage.getItem('installBannerDismissed') === '1') return;
    installBanner.style.display = 'flex';
    document.body.style.paddingTop = installBanner.offsetHeight + 'px';
  }
  // A diferencia de showInstallBanner(), esta versión ignora el "no
  // volver a mostrar": se usa cuando el usuario pide instalar a
  // propósito desde el menú, así que sí o sí hay que mostrárselo.
  function forceShowInstallBanner(){
    installBanner.style.display = 'flex';
    document.body.style.paddingTop = installBanner.offsetHeight + 'px';
  }
  function hideInstallBanner(){
    installBanner.style.display = 'none';
    document.body.style.paddingTop = '';
  }

  function isIos(){
    return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  }
  function isStandalone(){
    return (window.navigator.standalone === true) ||
           (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  }

  // Android/Chrome/Edge: Chrome nos avisa cuando la app cumple los
  // requisitos de instalación disparando este evento. Lo interceptamos
  // para mostrar NUESTRO banner en vez de esperar a que el usuario
  // busque la opción en el menú de 3 puntitos.
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferredInstallPrompt = e;
    document.getElementById('installBannerText').textContent = '📲 Instalá la app para acceso rápido';
    document.getElementById('installBannerBtn').style.display = 'inline-block';
    showInstallBanner();
    menuInstallBtn.style.display = 'block';
  });

  document.getElementById('installBannerBtn').addEventListener('click', async function(){
    if(!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    hideInstallBanner();
    menuInstallBtn.style.display = 'none';
  });

  document.getElementById('installBannerClose').addEventListener('click', function(){
    hideInstallBanner();
    localStorage.setItem('installBannerDismissed', '1');
    // Ojo: NO ocultamos menuInstallBtn acá — cerrar el banner no debe
    // dejarte sin ninguna forma de instalar salvo por los 3 puntitos.
  });

  window.addEventListener('appinstalled', function(){
    hideInstallBanner();
    localStorage.setItem('installBannerDismissed', '1');
    menuInstallBtn.style.display = 'none';
    deferredInstallPrompt = null;
  });

  // Ítem del menú: siempre disponible una vez que Chrome ofreció instalar
  // (Android) o directamente en iPhone (donde no hay evento programático).
  menuInstallBtn.addEventListener('click', function(){
    menuDropdown.style.display = 'none';
    if(deferredInstallPrompt){
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then(function(){
        deferredInstallPrompt = null;
        menuInstallBtn.style.display = 'none';
      });
    }else if(isIos() && !isStandalone()){
      document.getElementById('installBannerText').textContent = '📲 Instalá FeritApp: tocá Compartir → Agregar a inicio';
      document.getElementById('installBannerBtn').style.display = 'none';
      forceShowInstallBanner();
    }
  });

  // iOS/Safari: no existe beforeinstallprompt, así que mostramos
  // instrucciones manuales. El ítem del menú queda siempre visible acá
  // (no depende de si el banner se cerró antes), porque es la única
  // forma de volver a ver el instructivo sin depender del banner.
  if(isIos() && !isStandalone()){
    menuInstallBtn.style.display = 'block';
    document.getElementById('installBannerText').textContent = '📲 Instalá FeritApp: tocá Compartir → Agregar a inicio';
    document.getElementById('installBannerBtn').style.display = 'none';
    showInstallBanner();
  }
});
