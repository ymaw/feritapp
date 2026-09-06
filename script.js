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

  moreBtn.addEventListener('click', function(e){
    e.stopPropagation();
    toggleMenuFrom(moreBtn);
  });
  menuDropdown.addEventListener('click', function(e){ e.stopPropagation(); });
  document.addEventListener('click', function(){ menuDropdown.style.display = 'none'; });

  function switchView(view){
    document.getElementById('viewSales').style.display = (view === 'sales') ? 'block' : 'none';
    document.getElementById('viewDashboard').style.display = (view === 'dashboard') ? 'block' : 'none';
    document.getElementById('viewClients').style.display = (view === 'clients') ? 'block' : 'none';
    document.getElementById('viewRanking').style.display = (view === 'ranking') ? 'block' : 'none';
    document.getElementById('viewSettings').style.display = (view === 'settings') ? 'block' : 'none';

    let titles = { sales:'Registro semanal', clients:'Clientes', ranking:'Ranking de clientes', settings:'Configuración' };
    document.getElementById('viewHeading').textContent = titles[view] || 'Dashboard';

    document.querySelectorAll('.nav-item[data-view]').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    if(view === 'clients'){ renderClientSearch(); renderClientsFullList(); }
    if(view === 'ranking'){ rankingVisibleCount = 5; renderTopClients(); }
    if(view === 'settings'){ syncNotifyControls(); showSettingsMenu(); }
  }

  /* ---------------- Configuración: menú de dos niveles ---------------- */
  const SETTINGS_PANEL_IDS = {
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

  let currentUserEmail = null;

  function enterApp(user){
    if(entered) return;
    entered = true;
    currentUserEmail = user.email;
    document.getElementById('authGate').style.display = 'none';
    document.getElementById('appRoot').style.display = 'block';
    document.getElementById('sessionEmail').textContent = 'Ingresaste como ' + user.email;
    document.getElementById('profileEmail').textContent = user.email;
    window.history.replaceState({}, document.title, window.location.pathname);
    switchView('sales');
    resetIdleTimer();
    loadSales();
  }

  function showSetNewPinPrompt(){
    document.getElementById('authGate').style.display = 'flex';
    document.getElementById('appRoot').style.display = 'none';
    document.getElementById('gateStep1').style.display = 'none';
    document.getElementById('gateSent').style.display = 'none';
    document.getElementById('gateNewPin').style.display = 'block';
  }

  async function initGate(){
    if(!SUPABASE_READY){
      document.getElementById('authGate').style.display = 'flex';
      showGateError('Falta configurar Supabase (URL y clave del proyecto) para poder ingresar.');
      return;
    }
    document.getElementById('authGate').style.display = 'flex';

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
  let weekStartDay = 1; // 0=domingo .. 6=sábado. Por defecto: lunes.
  let notifyEnabled = true;
  let notifyDaysOverdue = 4;
  let receiptMessage = '¡Gracias por tu compra! Te esperamos pronto de nuevo.';
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
      categoria: row.categoria || 'Sin categoría'
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
      let settingsRes = await sb.from('user_settings').select('week_start_day, last_purge_semester, notify_enabled, notify_days_overdue, receipt_message').maybeSingle();
      if(settingsRes.data){
        weekStartDay = settingsRes.data.week_start_day;
        lastPurgeSemester = settingsRes.data.last_purge_semester;
        notifyEnabled = settingsRes.data.notify_enabled !== false;
        notifyDaysOverdue = settingsRes.data.notify_days_overdue || 4;
        if(settingsRes.data.receipt_message){ receiptMessage = settingsRes.data.receipt_message; }
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

  function generateReceiptCanvas(compradorNombre, items, mensaje){
    const W = 600, PADDING = 40, LINE_H = 34;
    const NAVY = '#01172F', GRAY = '#8892a0', ACCENT = '#446DF6';

    // Uso un canvas temporal solo para medir el texto del mensaje y
    // saber cuántas líneas ocupa, antes de fijar la altura final.
    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d');
    measureCtx.font = 'italic 13px Arial';
    const messageLines = mensaje ? wrapCanvasText(measureCtx, mensaje, W - PADDING * 2) : [];

    const headerH = 110;
    const itemsH = items.length * LINE_H;
    const footerH = messageLines.length ? (30 + messageLines.length * 19) : 20;
    const H = headerH + 60 + itemsH + 70 + footerH;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, 0, W, 8);

    let y = 46;
    ctx.textAlign = 'left';
    ctx.fillStyle = NAVY;
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Comprobante de compra', PADDING, y);

    y += 28;
    ctx.font = '13px Arial';
    ctx.fillStyle = GRAY;
    ctx.fillText(new Date().toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' }), PADDING, y);

    y += 24;
    drawDashedLine(ctx, PADDING, y, W - PADDING);

    y += 28;
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = NAVY;
    ctx.fillText('Comprador: ' + compradorNombre, PADDING, y);

    y += 20;
    drawDashedLine(ctx, PADDING, y, W - PADDING);

    y += 32;
    ctx.font = '15px Arial';
    let total = 0;
    items.forEach(function(it){
      ctx.textAlign = 'left';
      ctx.fillStyle = NAVY;
      ctx.fillText(truncateCanvasText(ctx, it.articulo, 340), PADDING, y);
      ctx.textAlign = 'right';
      let priceTxt = money(it.precio);
      ctx.fillText(priceTxt, W - PADDING, y);
      total += Number(it.precio) || 0;
      y += LINE_H;
    });

    y += 6;
    drawDashedLine(ctx, PADDING, y, W - PADDING);
    y += 36;

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
      ctx.font = 'italic 13px Arial';
      ctx.fillStyle = GRAY;
      messageLines.forEach(function(line){
        ctx.fillText(line, PADDING, y);
        y += 19;
      });
    }

    return canvas;
  }

  function shareReceipt(compradorNombre, items){
    if(!items || items.length === 0){ showToast('No hay artículos para compartir.'); return; }

    let canvas = generateReceiptCanvas(compradorNombre, items, receiptMessage);
    canvas.toBlob(async function(blob){
      if(!blob){ showToast('No se pudo generar el comprobante.'); return; }
      let safeName = compradorNombre.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      let file = new File([blob], 'comprobante-' + safeName + '.png', { type: 'image/png' });

      if(navigator.canShare && navigator.canShare({ files: [file] })){
        try{
          await navigator.share({ files: [file], text: receiptMessage || undefined });
          return;
        }catch(e){
          if(e && e.name === 'AbortError') return; // el usuario canceló, no es un error
        }
      }

      // Si no se puede compartir directo, se descarga para compartirlo a mano.
      let url = URL.createObjectURL(blob);
      let a = document.createElement('a');
      a.href = url; a.download = file.name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
      showToast('Comprobante descargado (tu navegador no soporta compartir directo)');
    }, 'image/png');
  }

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

  async function deleteSale(id){
    try{
      await sb.from('sales').delete().eq('id', id);
      sales = sales.filter(function(s){ return s.id !== id; });
      render();
    }catch(e){
      showToast('No se pudo borrar la venta.');
    }
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
    let maxTotal = Math.max.apply(null, keys.map(function(k){ return monthStats[k].total; }));

    let chartKeys = keys.slice(-6);
    let chartHtml = '<div class="month-chart">';
    chartKeys.forEach(function(k){
      let st = monthStats[k];
      let heightPct = maxTotal > 0 ? Math.max(4, Math.round((st.total / maxTotal) * 100)) : 4;
      let monthIdx = parseInt(k.split("-")[1], 10) - 1;
      chartHtml += '<div class="month-bar-col">' +
        '<div class="month-bar-value">' + money(st.total) + '</div>' +
        '<div class="month-bar' + (k === currentMK ? ' current' : '') + '" style="height:' + heightPct + '%"></div>' +
        '<div class="month-bar-label">' + MESES[monthIdx] + '</div>' +
      '</div>';
    });
    chartHtml += '</div>';

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
    // La comparación semanal se centra en CANTIDAD de artículos, no en dinero.
    let maxCount = Math.max.apply(null, keys.map(function(k){ return wStats[k].count; }));

    let chartKeys = keys.slice(-6);
    let chartHtml = '<div class="month-chart">';
    chartKeys.forEach(function(k){
      let st = wStats[k];
      let heightPct = maxCount > 0 ? Math.max(4, Math.round((st.count / maxCount) * 100)) : 4;
      chartHtml += '<div class="month-bar-col">' +
        '<div class="month-bar-value">' + st.count + '</div>' +
        '<div class="month-bar' + (k === thisWeekKey ? ' current' : '') + '" style="height:' + heightPct + '%"></div>' +
        '<div class="month-bar-label">' + formatRangeShort(k) + '</div>' +
      '</div>';
    });
    chartHtml += '</div>';

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

    let maxCount = ranked[0].count;

    let html = '<div class="cat-chart">';
    ranked.forEach(function(c){
      let pct = Math.max(6, Math.round((c.count / maxCount) * 100));
      let color = categoryColor(c.name);
      html += '<div class="cat-chart-row">' +
        '<div class="cat-chart-label"><span class="cat-dot" style="background:' + color + '"></span>' + escapeHtml(c.name) + '</div>' +
        '<div class="cat-chart-bar-wrap"><div class="cat-chart-bar" style="width:' + pct + '%; background:' + color + '"></div></div>' +
        '<div class="cat-chart-count">' + c.count + '</div>' +
      '</div>';
    });
    html += '</div>';
    wrap.innerHTML = html;
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
      html += '<div class="rank-item">' +
        '<div class="rank-medal">' + medal + '</div>' +
        '<div class="rank-info">' +
          '<div class="rank-name">' + escapeHtml(c.name) + '</div>' +
          '<div class="rank-sub">' + c.count + ' artículo' + (c.count === 1 ? '' : 's') + ' comprado' + (c.count === 1 ? '' : 's') + '</div>' +
        '</div>' +
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

  function weekStats(items){
    let total=0, cobrado=0, pendiente=0;
    items.forEach(function(i){
      total += Number(i.precio)||0;
      if(i.pagado) cobrado += Number(i.precio)||0;
      else pendiente += Number(i.precio)||0;
    });
    return {total:total, cobrado:cobrado, pendiente:pendiente, count:items.length};
  }

  function renderSalesTable(items, editable){
    if(!items.length){
      return '<div class="empty-inline">Sin artículos registrados.</div>';
    }
    let html = '<div class="table-card"><div class="table-wrap"><table class="sales-table"><thead><tr>' +
                 '<th>Artículo</th><th>Cliente</th><th class="num">Precio</th><th></th>' +
               '</tr></thead><tbody>';
    items.forEach(function(item){
      let fechaTxt = new Date(item.fecha).toLocaleDateString('es-AR', {weekday:'short', day:'numeric', month:'short'});
      let cat = item.categoria || 'Sin categoría';
      let retiraHtml = item.retira === 'otro'
        ? '<div class="retira-info other">↳ Retira: ' + escapeHtml(item.tercero) + '</div>'
        : '<div class="retira-info same">↳ Retira el mismo cliente</div>';
      html += '<tr>' +
                '<td>' +
                  '<div class="item-name">' + escapeHtml(item.articulo) + '</div>' +
                  '<span class="cat-badge"><span class="cat-dot" style="background:' + categoryColor(cat) + '"></span>' + escapeHtml(cat) + '</span>' +
                  '<div class="item-meta">' + fechaTxt + '</div>' +
                '</td>' +
                '<td><div class="client-name">' + escapeHtml(item.cliente || 'Sin nombre') + '</div>' + retiraHtml + '</td>' +
                '<td class="num price-cell">' + money(item.precio) + '</td>' +
                '<td><div class="row-actions">' +
                  (editable ? '<button class="edit-btn" data-edit="' + item.id + '" aria-label="Editar">✎</button>' : '') +
                  '<button class="pay-toggle ' + (item.pagado ? 'paid' : 'pending') + '" data-toggle-pay="' + item.id + '">' + (item.pagado ? 'Pagado' : 'Pendiente') + '</button>' +
                  '<button class="del-btn" data-del="' + item.id + '">✕</button>' +
                '</div></td>' +
              '</tr>';
    });
    html += '</tbody></table></div></div>';
    return html;
  }

  function bindTableEvents(root){
    root.querySelectorAll('[data-toggle-pay]').forEach(function(btn){
      btn.addEventListener('click', function(){
        let id = btn.getAttribute('data-toggle-pay');
        let item = sales.find(function(s){ return s.id === id; });
        if(item){ toggleSalePago(id, item.pagado); }
      });
    });
    root.querySelectorAll('[data-del]').forEach(function(btn){
      btn.addEventListener('click', function(){
        deleteSale(btn.getAttribute('data-del'));
      });
    });
    root.querySelectorAll('[data-edit]').forEach(function(btn){
      btn.addEventListener('click', function(){
        let id = btn.getAttribute('data-edit');
        let item = sales.find(function(s){ return s.id === id; });
        if(item){ openEditSheet(item); }
      });
    });
  }

  function render(){
    let groups = groupByWeek();
    let keys = Object.keys(groups).sort().reverse();
    let currentKey = weekKey(new Date());

    /* current week: table of articles (shown above the summary) — editable */
    let curItems = (groups[currentKey] || []).slice().sort(function(a,b){ return new Date(b.fecha)-new Date(a.fecha); });
    let curTableEl = document.getElementById('currentWeekTable');
    curTableEl.innerHTML = renderSalesTable(curItems, true);
    bindTableEvents(curTableEl);

    /* current week: summary ticket, below the table */
    let curStats = weekStats(curItems);
    document.getElementById('currentTicket').innerHTML =
      '<div class="ticket">' +
        '<div class="ticket-head"><span class="week-label">Resumen de la semana</span><span class="week-range">' + formatRange(currentKey) + '</span></div>' +
        '<div class="ticket-row"><span class="label">Artículos vendidos</span><span class="value">' + curStats.count + '</span></div>' +
        '<div class="ticket-row"><span class="label">Cobrado</span><span class="value">' + money(curStats.cobrado) + '</span></div>' +
        '<div class="ticket-row"><span class="label">Pendiente de cobro</span><span class="value">' + money(curStats.pendiente) + '</span></div>' +
        '<hr class="ticket-rule">' +
        '<div class="ticket-row total"><span class="label">Total vendido</span><span class="value">' + money(curStats.total) + '</span></div>' +
      '</div>';

    /* previous weeks: accordion history */
    let pastKeys = keys.filter(function(k){ return k !== currentKey; });
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
    pastKeys.forEach(function(k){
      let st = weekStats(groups[k]);
      let label = "Semana del " + formatRange(k);
      html += '<button class="week-toggle" data-week="' + k + '">' +
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
          itemsEl.innerHTML = renderSalesTable(items);
          bindTableEvents(itemsEl);
          itemsEl.setAttribute('data-loaded', '1');
        }

        btn.classList.toggle('open');
        itemsEl.classList.toggle('open');
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
    let matches = sales.filter(function(s){
      return weekKey(new Date(s.fecha)) === thisWeekKey &&
             (s.cliente || '').toLowerCase().indexOf(query) !== -1;
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
    let html = '<div class="client-list">';
    sorted.forEach(function(name){
      html += '<div class="client-row">' +
                '<button type="button" class="client-list-item" data-client-name="' + escapeHtml(name) + '">' + escapeHtml(name) + '</button>' +
                '<button type="button" class="client-edit-btn" data-edit-client="' + escapeHtml(name) + '" aria-label="Editar cliente">✎</button>' +
                '<button type="button" class="client-del-btn" data-del-client="' + escapeHtml(name) + '" aria-label="Eliminar cliente">✕</button>' +
              '</div>';
    });
    html += '</div>';
    wrap.innerHTML = html;

    wrap.querySelectorAll('[data-client-name]').forEach(function(btn){
      btn.addEventListener('click', function(){
        searchInput.value = btn.getAttribute('data-client-name');
        renderClientSearch();
        renderClientsFullList();
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
    try{
      await sb.from('clients').delete().eq('name', name);
      clients = clients.filter(function(c){ return c.toLowerCase() !== name.toLowerCase(); });
      refreshClientsDatalist();
      renderClientsFullList();
      showToast('Cliente eliminado de la lista');
    }catch(e){
      showToast('No se pudo eliminar el cliente.');
    }
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
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function(){ t.classList.remove('show'); }, duration || 2200);
  }

  /* ---------------- sheet open/close ---------------- */
  function openSheet(){
    sheet.classList.add('open'); scrim.classList.add('open');
  }
  function closeSheet(){
    sheet.classList.remove('open'); scrim.classList.remove('open');
    resetForm();
  }
  document.getElementById('openSheet').addEventListener('click', openSheet);
  scrim.addEventListener('click', closeSheet);

  /* ---------------- form state ---------------- */
  let formState = { pagado: false, retira: 'cliente' };
  let editingSaleId = null;
  let itemRowCounter = 0;

  function categoryOptionsHtml(selected){
    return categories.map(function(c){
      let sel = (c === selected) ? ' selected' : '';
      return '<option value="' + escapeHtml(c) + '"' + sel + '>' + escapeHtml(c) + '</option>';
    }).join('');
  }

  function addItemRow(prefill, isOriginal){
    itemRowCounter++;
    let rowId = 'row' + itemRowCounter;
    let container = document.getElementById('itemRowsContainer');
    let defaultCat = (prefill && prefill.categoria) || (categories.length ? categories[0] : '');

    let html =
      '<div class="item-row" data-row-id="' + rowId + '"' + (isOriginal ? ' data-original="1"' : '') + '>' +
        '<div class="item-row-header">' +
          '<span class="item-row-label">Artículo</span>' +
          '<button type="button" class="item-row-del" data-del-row="' + rowId + '">✕ Quitar</button>' +
        '</div>' +
        '<div class="input-row">' +
          '<input type="text" class="row-articulo" placeholder="Ej: remera azul talle M" value="' + (prefill ? escapeHtml(prefill.articulo) : '') + '">' +
          '<button class="mic-btn" type="button" data-row="' + rowId + '" data-field="articulo" data-mode="text" aria-label="Dictar artículo">🎤</button>' +
        '</div>' +
        '<div class="input-row">' +
          '<input type="number" class="row-precio" placeholder="0" inputmode="decimal" value="' + (prefill ? prefill.precio : '') + '">' +
          '<button class="mic-btn" type="button" data-row="' + rowId + '" data-field="precio" data-mode="number" aria-label="Dictar precio">🎤</button>' +
        '</div>' +
        '<select class="row-categoria">' + categoryOptionsHtml(defaultCat) + '</select>' +
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
      // La fila "original" (el artículo que se está editando) nunca se
      // puede quitar desde acá — para eso está el botón de borrar venta
      // en la tabla. Las demás filas sí, salvo que sea la única.
      if(r.getAttribute('data-original') === '1'){
        del.style.display = 'none';
      }else{
        del.style.display = rows.length <= 1 ? 'none' : 'inline-block';
      }
    });
  }

  function updateItemsTotal(){
    let total = 0;
    document.querySelectorAll('#itemRowsContainer .row-precio').forEach(function(inp){
      let v = parseFloat(inp.value);
      if(!isNaN(v)) total += v;
    });
    let el = document.getElementById('itemsTotalValue');
    if(el) el.textContent = money(total);
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
    document.getElementById('saveBtnText').textContent = 'Guardar venta';
  }

  function openEditSheet(item){
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
      if(editingSaleId){
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
    if(!confirm('¿Borrar todo el historial de ventas? Esta acción no se puede deshacer.')) return;
    try{
      // truco para borrar todas las filas propias: RLS ya limita a las del usuario
      await sb.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      sales = [];
      render();
      showToast('Datos borrados');
    }catch(e){
      showToast('No se pudieron borrar los datos.');
    }
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
