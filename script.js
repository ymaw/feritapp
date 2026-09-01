document.addEventListener('DOMContentLoaded', function(){
  "use strict";

  /* =========================================================
     ACCESO: magic link con Supabase Auth
     =========================================================
     Completá estos 2 datos con los de TU proyecto de Supabase
     (Settings → API): Project URL y la clave "anon public".
     Nunca pongas acá la clave "service_role".
  ========================================================= */
  var SUPABASE_URL = "https://tzajchnflgvdbmiwfyvj.supabase.co";
  var SUPABASE_ANON_KEY = "sb_publishable_IZtlTCgLYAJCRuLBaDvlkQ_yhHfOIcE";

  var SUPABASE_READY = SUPABASE_URL.indexOf("PEGAR_") !== 0
                     && SUPABASE_ANON_KEY.indexOf("PEGAR_") !== 0
                     && typeof supabase !== 'undefined';

  var sb = SUPABASE_READY ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  }) : null;
  var entered = false;

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
    var err = document.getElementById('gateError');
    err.textContent = msg;
    err.style.display = 'block';
  }

  function checkGateInputs(){
    document.getElementById('gateError').style.display = 'none';
  }

  function updatePwRequirements(){
    var pin = document.getElementById('gatePin').value;
    setReq('reqLength', pin.length >= 6);
    setReq('reqUpper', /[A-Z]/.test(pin));
    setReq('reqNumber', /[0-9]/.test(pin));
    setReq('reqSymbol', /[^A-Za-z0-9]/.test(pin));
  }
  function setReq(id, ok){
    var el = document.getElementById(id);
    if(!el) return;
    el.querySelector('.req-icon').textContent = ok ? '✓' : '✕';
    el.classList.toggle('req-ok', ok);
    el.classList.toggle('req-bad', !ok);
  }

  ['gateEmail','gatePin','gatePinConfirm'].forEach(function(id){
    document.getElementById(id).addEventListener('input', checkGateInputs);
  });
  document.getElementById('gatePin').addEventListener('input', updatePwRequirements);

  document.getElementById('loginBtn').addEventListener('click', async function(){
    var email = document.getElementById('gateEmail').value.trim().toLowerCase();
    var pin = document.getElementById('gatePin').value;

    if(!isValidEmail(email)){ showGateError('Ingresá un correo electrónico válido.'); return; }
    if(!pin){ showGateError('Ingresá tu contraseña.'); return; }
    if(!SUPABASE_READY){ showGateError('Todavía no se configuró Supabase (faltan la URL y la clave del proyecto en script.js).'); return; }

    var loginBtn = document.getElementById('loginBtn');
    var signupBtn = document.getElementById('signupBtn');
    loginBtn.disabled = true; signupBtn.disabled = true;

    var loginRes = await sb.auth.signInWithPassword({ email: email, password: pin });

    loginBtn.disabled = false; signupBtn.disabled = false;

    if(loginRes.error){
      showGateError('Correo o contraseña incorrectos.');
      return;
    }
    if(loginRes.data && loginRes.data.user){ enterApp(loginRes.data.user); }
  });

  document.getElementById('signupBtn').addEventListener('click', async function(){
    var confirmField = document.getElementById('pinConfirmField');

    // Primer click en "Crear cuenta": solo revela confirmar contraseña + el checklist.
    // No envía nada todavía — recién en el segundo click se procesa el alta.
    if(confirmField.style.display === 'none'){
      confirmField.style.display = 'block';
      updatePwRequirements();
      document.getElementById('gatePinConfirm').focus();
      return;
    }

    var email = document.getElementById('gateEmail').value.trim().toLowerCase();
    var pin = document.getElementById('gatePin').value;
    var pinConfirm = document.getElementById('gatePinConfirm').value;

    if(!isValidEmail(email)){ showGateError('Ingresá un correo electrónico válido.'); return; }
    if(!isValidPassword(pin)){ showGateError('La contraseña necesita mínimo 6 caracteres, con una mayúscula, un número y un símbolo.'); return; }
    if(pin !== pinConfirm){ showGateError('Las contraseñas no coinciden.'); return; }
    if(!SUPABASE_READY){ showGateError('Todavía no se configuró Supabase (faltan la URL y la clave del proyecto en script.js).'); return; }

    var loginBtn = document.getElementById('loginBtn');
    var signupBtn = document.getElementById('signupBtn');
    loginBtn.disabled = true; signupBtn.disabled = true;

    var redirectTo = window.location.origin + window.location.pathname;
    var signUpRes = await sb.auth.signUp({
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
    var email = document.getElementById('gateEmail').value.trim().toLowerCase();
    if(!isValidEmail(email)){
      showGateError('Escribí tu correo arriba y volvé a tocar "Olvidé mi contraseña".');
      return;
    }
    if(!SUPABASE_READY){ showGateError('Falta configurar Supabase.'); return; }

    var redirectTo = window.location.origin + window.location.pathname;
    var res = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectTo });
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
    var p1 = document.getElementById('newPin').value;
    var p2 = document.getElementById('newPinConfirm').value;
    var err = document.getElementById('newPinError');
    err.style.display = 'none';

    if(!isValidPassword(p1)){ err.textContent = 'Mínimo 6 caracteres, con una mayúscula, un número y un símbolo.'; err.style.display = 'block'; return; }
    if(p1 !== p2){ err.textContent = 'Las contraseñas no coinciden.'; err.style.display = 'block'; return; }

    var res = await sb.auth.updateUser({ password: p1 });
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

  /* ---------------- menú desplegable / vistas ---------------- */
  var moreBtn = document.getElementById('moreBtn');
  var menuDropdown = document.getElementById('menuDropdown');

  // Abre el desplegable anclado al botón "Más" del menú inferior,
  // calculando si conviene abrirlo hacia abajo o hacia arriba según
  // el espacio disponible en pantalla.
  function openMenuFrom(anchorEl){
    menuDropdown.style.visibility = 'hidden';
    menuDropdown.style.display = 'block';
    var ddHeight = menuDropdown.offsetHeight;
    menuDropdown.style.visibility = '';

    var rect = anchorEl.getBoundingClientRect();
    var spaceBelow = window.innerHeight - rect.bottom;
    var top = (spaceBelow >= ddHeight + 12) ? (rect.bottom + 8) : (rect.top - ddHeight - 8);

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

    var titles = { sales:'Registro semanal', clients:'Clientes', ranking:'Ranking de clientes' };
    document.getElementById('viewHeading').textContent = titles[view] || 'Dashboard';

    document.querySelectorAll('.nav-item[data-view]').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    if(view === 'clients'){ renderClientSearch(); renderClientsFullList(); }
    if(view === 'ranking'){ rankingVisibleCount = 5; renderTopClients(); }
  }

  document.querySelectorAll('[data-view]').forEach(function(btn){
    btn.addEventListener('click', function(){
      switchView(btn.getAttribute('data-view'));
      menuDropdown.style.display = 'none';
    });
  });

  function enterApp(user){
    if(entered) return;
    entered = true;
    document.getElementById('authGate').style.display = 'none';
    document.getElementById('appRoot').style.display = 'block';
    document.getElementById('sessionEmail').textContent = 'Ingresaste como ' + user.email;
    window.history.replaceState({}, document.title, window.location.pathname);
    switchView('sales');
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
    var recoveryDetected = false;

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
      var sessionRes = await sb.auth.getSession();
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

  var sales = [];
  var categories = [];
  var clients = [];
  var weekStartDay = 1; // 0=domingo .. 6=sábado. Por defecto: lunes.
  var sheet = document.getElementById('sheet');
  var scrim = document.getElementById('scrim');
  var CATEGORY_COLORS = ['#446DF6','#08A4BD','#17A897','#B23A52','#8C4A9C','#5FA8A0','#6C8EBF','#C9A15F'];

  function categoryColor(name){
    var str = String(name || '');
    var hash = 0;
    for(var i=0;i<str.length;i++){ hash = (hash * 31 + str.charCodeAt(i)) >>> 0; }
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
    var dl = document.getElementById('clientsDatalist');
    if(!dl) return;
    dl.innerHTML = clients.map(function(c){
      return '<option value="' + escapeHtml(c) + '">';
    }).join('');
  }

  async function persistClientIfNew(name){
    var exists = clients.some(function(c){ return c.toLowerCase() === name.toLowerCase(); });
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
      var res = await sb.from('sales').select('*').order('fecha', { ascending:false });
      sales = (res.data || []).map(mapRowToSale);
    }catch(e){
      sales = [];
      showToast('No se pudieron cargar las ventas.');
    }

    try{
      var catRes = await sb.from('categories').select('*').order('created_at', { ascending:true });
      categories = (catRes.data || []).map(function(c){ return c.name; });
    }catch(e){
      categories = [];
    }

    if(categories.length === 0){
      var defaults = ["Remeras","Pantalones","Vestidos","Accesorios"];
      for(var i=0;i<defaults.length;i++){
        await persistNewCategory(defaults[i]);
      }
      categories = defaults;
    }

    try{
      var clientsRes = await sb.from('clients').select('*').order('name', { ascending:true });
      clients = (clientsRes.data || []).map(function(c){ return c.name; });
    }catch(e){
      clients = [];
    }
    refreshClientsDatalist();

    try{
      var settingsRes = await sb.from('user_settings').select('week_start_day').maybeSingle();
      if(settingsRes.data){
        weekStartDay = settingsRes.data.week_start_day;
      }else{
        await sb.from('user_settings').insert([{}]); // usa los valores por defecto (lunes)
        weekStartDay = 1;
      }
    }catch(e){
      weekStartDay = 1;
    }
    var weekStartSelect = document.getElementById('weekStartSelect');
    if(weekStartSelect){ weekStartSelect.value = String(weekStartDay); }

    await checkSemesterCleanup();

    render();
    resetForm();
  }

  // Cada semestre (ene-jun / jul-dic), borra las ventas anteriores al
  // mes en curso, dejando solo el mes actual. Se controla con
  // last_purge_semester en user_settings para que corra como mucho
  // una vez por semestre, no en cada inicio de sesión.
  function csvEscape(val){
    val = String(val === null || val === undefined ? '' : val);
    if(/[",\n;]/.test(val)){
      val = '"' + val.replace(/"/g, '""') + '"';
    }
    return val;
  }

  function exportSalesToCSV(items, filename){
    if(!items || items.length === 0) return false;

    var headers = ['Fecha','Cliente','Artículo','Categoría','Precio','Pagado','Retira','Tercero'];
    var lines = [headers.map(csvEscape).join(',')];

    items.slice().sort(function(a,b){ return new Date(a.fecha) - new Date(b.fecha); }).forEach(function(s){
      var fechaTxt = new Date(s.fecha).toLocaleDateString('es-AR') + ' ' + new Date(s.fecha).toLocaleTimeString('es-AR', {hour:'2-digit', minute:'2-digit'});
      var retiraTxt = s.retira === 'otro' ? 'Otra persona' : 'El mismo cliente';
      var row = [fechaTxt, s.cliente, s.articulo, s.categoria, s.precio, s.pagado ? 'Sí' : 'No', retiraTxt, s.tercero || ''];
      lines.push(row.map(csvEscape).join(','));
    });

    // \uFEFF (BOM) al principio para que Excel abra los acentos bien.
    var csvContent = '\uFEFF' + lines.join('\r\n');
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
    return true;
  }

  async function checkSemesterCleanup(){
    var now = new Date();
    var currentSemester = now.getFullYear() + '-' + (now.getMonth() < 6 ? 'H1' : 'H2');

    try{
      var res = await sb.from('user_settings').select('last_purge_semester').maybeSingle();
      var stored = res.data ? res.data.last_purge_semester : null;

      if(stored && stored !== currentSemester){
        var startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        var oldItems = sales.filter(function(s){ return new Date(s.fecha) < startOfMonth; });

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

  document.getElementById('weekStartSelect').addEventListener('change', async function(){
    var val = parseInt(this.value, 10);
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
      var item = sales.find(function(s){ return s.id === id; });
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
    var date = new Date(d);
    var day = date.getDay(); // 0 sun .. 6 sat
    var diff = (day - weekStartDay + 7) % 7; // días desde el inicio de semana elegido
    date.setDate(date.getDate() - diff);
    date.setHours(0,0,0,0);
    return date;
  }
  function weekKey(d){
    var s = startOfWeek(d);
    return s.getFullYear() + "-" + String(s.getMonth()+1).padStart(2,'0') + "-" + String(s.getDate()).padStart(2,'0');
  }
  var MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  var MESES_LARGO = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  function formatRange(weekStartKey){
    var start = new Date(weekStartKey + "T00:00:00");
    var end = new Date(start); end.setDate(end.getDate()+6);
    return start.getDate() + " " + MESES[start.getMonth()] + " – " + end.getDate() + " " + MESES[end.getMonth()];
  }
  function money(n){
    return "$" + Number(n||0).toLocaleString('es-AR');
  }
  function monthKey(d){
    var date = new Date(d);
    return date.getFullYear() + "-" + String(date.getMonth()+1).padStart(2,'0');
  }
  function monthLabel(key){
    var parts = key.split("-");
    var y = parts[0], m = parseInt(parts[1],10) - 1;
    return MESES_LARGO[m] + " " + y;
  }

  /* ---------------- rendering ---------------- */
  function groupByWeek(){
    var groups = {};
    sales.forEach(function(s){
      var k = weekKey(new Date(s.fecha));
      if(!groups[k]) groups[k] = [];
      groups[k].push(s);
    });
    return groups;
  }

  function groupByMonth(){
    var groups = {};
    sales.forEach(function(s){
      var k = monthKey(s.fecha);
      if(!groups[k]) groups[k] = [];
      groups[k].push(s);
    });
    return groups;
  }

  var compareMonthA = null, compareMonthB = null;
  var compareWeekA = null, compareWeekB = null;
  var comparePeriodMode = 'week';

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
    var pct = Math.round(((a - b) / b) * 100);
    if(pct === 0) return '<span class="delta flat">0%</span>';
    var cls = pct > 0 ? 'up' : 'down';
    var arrow = pct > 0 ? '▲' : '▼';
    return '<span class="delta ' + cls + '">' + arrow + ' ' + Math.abs(pct) + '%</span>';
  }

  function renderMonthComparison(){
    var wrap = document.getElementById('periodCompare');
    if(!wrap) return;

    var groups = groupByMonth();
    var keys = Object.keys(groups).sort();

    if(keys.length === 0){
      wrap.innerHTML = '<div class="empty-inline">Todavía no hay ventas suficientes para comparar meses.</div>';
      return;
    }

    var currentMK = monthKey(new Date());
    var monthStats = {};
    keys.forEach(function(k){ monthStats[k] = weekStats(groups[k]); });
    var maxTotal = Math.max.apply(null, keys.map(function(k){ return monthStats[k].total; }));

    var chartKeys = keys.slice(-6);
    var chartHtml = '<div class="month-chart">';
    chartKeys.forEach(function(k){
      var st = monthStats[k];
      var heightPct = maxTotal > 0 ? Math.max(4, Math.round((st.total / maxTotal) * 100)) : 4;
      var monthIdx = parseInt(k.split("-")[1], 10) - 1;
      chartHtml += '<div class="month-bar-col">' +
        '<div class="month-bar-value">' + money(st.total) + '</div>' +
        '<div class="month-bar' + (k === currentMK ? ' current' : '') + '" style="height:' + heightPct + '%"></div>' +
        '<div class="month-bar-label">' + MESES[monthIdx] + '</div>' +
      '</div>';
    });
    chartHtml += '</div>';

    if(!compareMonthA || keys.indexOf(compareMonthA) === -1){ compareMonthA = keys[keys.length - 1]; }
    if(!compareMonthB || keys.indexOf(compareMonthB) === -1){ compareMonthB = keys.length > 1 ? keys[keys.length - 2] : keys[keys.length - 1]; }

    var optionsHtml = keys.slice().reverse().map(function(k){
      return '<option value="' + k + '">' + monthLabel(k) + '</option>';
    }).join('');

    var selectHtml = '<div class="compare-row">' +
      '<select class="compare-select" id="compareSelectA">' + optionsHtml + '</select>' +
      '<select class="compare-select" id="compareSelectB">' + optionsHtml + '</select>' +
    '</div>';

    var stA = monthStats[compareMonthA] || {total:0,cobrado:0,pendiente:0,count:0};
    var stB = monthStats[compareMonthB] || {total:0,cobrado:0,pendiente:0,count:0};

    var tableHtml = '<div class="compare-table-card"><table class="compare-table"><tbody>' +
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
    var start = new Date(weekStartKey + "T00:00:00");
    return start.getDate() + " " + MESES[start.getMonth()];
  }

  function renderWeekComparison(){
    var wrap = document.getElementById('periodCompare');
    if(!wrap) return;

    var groups = groupByWeek();
    var keys = Object.keys(groups).sort();

    if(keys.length === 0){
      wrap.innerHTML = '<div class="empty-inline">Todavía no hay ventas suficientes para comparar semanas.</div>';
      return;
    }

    var thisWeekKey = weekKey(new Date());
    var wStats = {};
    keys.forEach(function(k){ wStats[k] = weekStats(groups[k]); });
    // La comparación semanal se centra en CANTIDAD de artículos, no en dinero.
    var maxCount = Math.max.apply(null, keys.map(function(k){ return wStats[k].count; }));

    var chartKeys = keys.slice(-6);
    var chartHtml = '<div class="month-chart">';
    chartKeys.forEach(function(k){
      var st = wStats[k];
      var heightPct = maxCount > 0 ? Math.max(4, Math.round((st.count / maxCount) * 100)) : 4;
      chartHtml += '<div class="month-bar-col">' +
        '<div class="month-bar-value">' + st.count + '</div>' +
        '<div class="month-bar' + (k === thisWeekKey ? ' current' : '') + '" style="height:' + heightPct + '%"></div>' +
        '<div class="month-bar-label">' + formatRangeShort(k) + '</div>' +
      '</div>';
    });
    chartHtml += '</div>';

    if(!compareWeekA || keys.indexOf(compareWeekA) === -1){ compareWeekA = keys[keys.length - 1]; }
    if(!compareWeekB || keys.indexOf(compareWeekB) === -1){ compareWeekB = keys.length > 1 ? keys[keys.length - 2] : keys[keys.length - 1]; }

    var optionsHtml = keys.slice().reverse().map(function(k){
      return '<option value="' + k + '">Semana del ' + formatRange(k) + '</option>';
    }).join('');

    var selectHtml = '<div class="compare-row">' +
      '<select class="compare-select" id="compareWeekSelectA">' + optionsHtml + '</select>' +
      '<select class="compare-select" id="compareWeekSelectB">' + optionsHtml + '</select>' +
    '</div>';

    var stA = wStats[compareWeekA] || {total:0,cobrado:0,pendiente:0,count:0};
    var stB = wStats[compareWeekB] || {total:0,cobrado:0,pendiente:0,count:0};

    var tableHtml = '<div class="compare-table-card"><table class="compare-table"><tbody>' +
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

  var showRankingMoney = false;
  var rankingVisibleCount = 5;

  function renderTopClients(){
    var wrap = document.getElementById('topClients');
    if(!wrap) return;

    if(sales.length === 0){
      wrap.innerHTML = '<div class="empty-inline">Todavía no hay ventas registradas.</div>';
      return;
    }

    var byClient = {};
    sales.forEach(function(s){
      var name = s.cliente || 'Sin nombre';
      if(!byClient[name]){ byClient[name] = { name: name, count: 0, total: 0 }; }
      byClient[name].count += 1;
      byClient[name].total += Number(s.precio) || 0;
    });

    // El ranking ordena por CANTIDAD de artículos comprados (no por monto).
    var ranked = Object.keys(byClient).map(function(k){ return byClient[k]; });
    ranked.sort(function(a, b){ return b.count - a.count || b.total - a.total; });

    var visible = ranked.slice(0, rankingVisibleCount);

    var medals = ['🥇','🥈','🥉'];
    var html = '<div class="rank-list">';
    visible.forEach(function(c, idx){
      var medal = medals[idx] || ('#' + (idx + 1));
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

    var moreBtn = document.getElementById('rankingShowMoreBtn');
    if(moreBtn){
      moreBtn.addEventListener('click', function(){
        rankingVisibleCount += 5;
        renderTopClients();
      });
    }
  }

  var toggleRankingMoneyBtn = document.getElementById('toggleRankingMoney');
  if(toggleRankingMoneyBtn){
    toggleRankingMoneyBtn.addEventListener('click', function(){
      showRankingMoney = !showRankingMoney;
      toggleRankingMoneyBtn.textContent = showRankingMoney ? '💰 Ocultar montos gastados' : '💰 Mostrar montos gastados';
      renderTopClients();
    });
  }

  function weekStats(items){
    var total=0, cobrado=0, pendiente=0;
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
    var html = '<div class="table-card"><div class="table-wrap"><table class="sales-table"><thead><tr>' +
                 '<th>Artículo</th><th>Cliente</th><th class="num">Precio</th><th></th>' +
               '</tr></thead><tbody>';
    items.forEach(function(item){
      var fechaTxt = new Date(item.fecha).toLocaleDateString('es-AR', {weekday:'short', day:'numeric', month:'short'});
      var cat = item.categoria || 'Sin categoría';
      var retiraHtml = item.retira === 'otro'
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
        var id = btn.getAttribute('data-toggle-pay');
        var item = sales.find(function(s){ return s.id === id; });
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
        var id = btn.getAttribute('data-edit');
        var item = sales.find(function(s){ return s.id === id; });
        if(item){ openEditSheet(item); }
      });
    });
  }

  function render(){
    var groups = groupByWeek();
    var keys = Object.keys(groups).sort().reverse();
    var currentKey = weekKey(new Date());

    /* current week: table of articles (shown above the summary) — editable */
    var curItems = (groups[currentKey] || []).slice().sort(function(a,b){ return new Date(b.fecha)-new Date(a.fecha); });
    var curTableEl = document.getElementById('currentWeekTable');
    curTableEl.innerHTML = renderSalesTable(curItems, true);
    bindTableEvents(curTableEl);

    /* current week: summary ticket, below the table */
    var curStats = weekStats(curItems);
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
    var pastKeys = keys.filter(function(k){ return k !== currentKey; });
    var container = document.getElementById('weeksContainer');
    if(pastKeys.length === 0){
      container.innerHTML = '<div class="empty"><b>Sin historial todavía</b>Las semanas anteriores van a aparecer acá.</div>';
      renderPeriodComparison();
      renderTopClients();
      renderClientSearch();
      renderClientsFullList();
      return;
    }
    var html = '';
    pastKeys.forEach(function(k){
      var st = weekStats(groups[k]);
      var label = "Semana del " + formatRange(k);
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
        var wk = btn.getAttribute('data-week');
        var itemsEl = document.getElementById('wk-' + wk);

        if(itemsEl.getAttribute('data-loaded') === '0'){
          var items = groups[wk].slice().sort(function(a,b){ return new Date(b.fecha)-new Date(a.fecha); });
          itemsEl.innerHTML = renderSalesTable(items);
          bindTableEvents(itemsEl);
          itemsEl.setAttribute('data-loaded', '1');
        }

        btn.classList.toggle('open');
        itemsEl.classList.toggle('open');
      });
    });

    renderPeriodComparison();
    renderTopClients();
    renderClientSearch();
    renderClientsFullList();
  }

  function renderClientSearch(){
    var input = document.getElementById('clientSearch');
    var wrap = document.getElementById('clientSearchResults');
    if(!input || !wrap) return;
    var query = input.value.trim().toLowerCase();
    if(!query){ wrap.innerHTML = ''; return; }

    var thisWeekKey = weekKey(new Date());
    var matches = sales.filter(function(s){
      return weekKey(new Date(s.fecha)) === thisWeekKey &&
             (s.cliente || '').toLowerCase().indexOf(query) !== -1;
    });

    if(matches.length === 0){
      wrap.innerHTML = '<div class="empty-inline">Sin ventas de esta semana para ese nombre.</div>';
      return;
    }

    var st = weekStats(matches);
    var owedClass = st.pendiente > 0 ? '' : 'zero';
    var summaryHtml = '<div class="client-summary">' +
      '<div><div class="name">' + escapeHtml(query) + '</div><div class="owed-label">Debe abonar esta semana</div></div>' +
      '<div class="owed-value ' + owedClass + '">' + money(st.pendiente) + '</div>' +
    '</div>';

    var sorted = matches.slice().sort(function(a,b){ return new Date(b.fecha)-new Date(a.fecha); });
    wrap.innerHTML = summaryHtml + renderSalesTable(sorted, false);
    bindTableEvents(wrap);
  }

  function renderClientsFullList(){
    var searchInput = document.getElementById('clientSearch');
    var wrap = document.getElementById('clientsFullList');
    if(!searchInput || !wrap) return;

    if(searchInput.value.trim()){ wrap.innerHTML = ''; return; }

    if(clients.length === 0){
      wrap.innerHTML = '<div class="empty-inline">Todavía no guardaste ningún cliente. Se guardan solos la primera vez que cargués una venta con su nombre.</div>';
      return;
    }

    var sorted = clients.slice().sort(function(a,b){ return a.localeCompare(b, 'es'); });
    var html = '<div class="client-list">';
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
        var oldName = btn.getAttribute('data-edit-client');
        var newName = prompt('Editar nombre del cliente:', oldName);
        if(newName === null) return;
        newName = newName.trim();
        if(!newName || newName === oldName) return;
        renameClientEntry(oldName, newName);
      });
    });
    wrap.querySelectorAll('[data-del-client]').forEach(function(btn){
      btn.addEventListener('click', function(){
        var name = btn.getAttribute('data-del-client');
        if(confirm('¿Eliminar a "' + name + '" de tu lista de clientes?\n\nEsto NO borra sus ventas ya registradas, solo lo saca del autocompletado y de esta lista.')){
          deleteClientEntry(name);
        }
      });
    });
  }

  async function renameClientEntry(oldName, newName){
    try{
      await sb.from('clients').update({ name: newName }).eq('name', oldName);
      await sb.from('sales').update({ cliente: newName }).eq('cliente', oldName);
      clients = clients.map(function(c){ return c.toLowerCase() === oldName.toLowerCase() ? newName : c; });
      sales.forEach(function(s){ if(s.cliente === oldName){ s.cliente = newName; } });
      refreshClientsDatalist();
      document.getElementById('clientSearch').value = '';
      render();
      showToast('Cliente actualizado');
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

  var clientSearchDebounce = null;
  document.getElementById('clientSearch').addEventListener('input', function(){
    clearTimeout(clientSearchDebounce);
    clientSearchDebounce = setTimeout(function(){
      renderClientSearch();
      renderClientsFullList();
    }, 150);
  });

  function escapeHtml(str){
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function showToast(msg, duration){
    var t = document.getElementById('toast');
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
  var formState = { pagado: false, retira: 'cliente' };
  var editingSaleId = null;
  var itemRowCounter = 0;

  function categoryOptionsHtml(selected){
    return categories.map(function(c){
      var sel = (c === selected) ? ' selected' : '';
      return '<option value="' + escapeHtml(c) + '"' + sel + '>' + escapeHtml(c) + '</option>';
    }).join('');
  }

  function addItemRow(prefill){
    itemRowCounter++;
    var rowId = 'row' + itemRowCounter;
    var container = document.getElementById('itemRowsContainer');
    var defaultCat = (prefill && prefill.categoria) || (categories.length ? categories[0] : '');

    var html =
      '<div class="item-row" data-row-id="' + rowId + '">' +
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
    var rowEl = container.querySelector('[data-row-id="' + rowId + '"]');

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
    var rows = document.querySelectorAll('#itemRowsContainer .item-row');
    rows.forEach(function(r, idx){
      r.querySelector('.item-row-label').textContent = 'Artículo ' + (idx + 1);
      var del = r.querySelector('.item-row-del');
      del.style.display = rows.length <= 1 ? 'none' : 'inline-block';
    });
  }

  function updateItemsTotal(){
    var total = 0;
    document.querySelectorAll('#itemRowsContainer .row-precio').forEach(function(inp){
      var v = parseFloat(inp.value);
      if(!isNaN(v)) total += v;
    });
    var el = document.getElementById('itemsTotalValue');
    if(el) el.textContent = money(total);
  }

  function refreshAllRowCategorySelects(){
    document.querySelectorAll('#itemRowsContainer .row-categoria').forEach(function(sel){
      var current = sel.value;
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

    // En modo edición solo se toca UN artículo a la vez.
    document.getElementById('itemRowsContainer').innerHTML = '';
    itemRowCounter = 0;
    addItemRow({ articulo: item.articulo, precio: item.precio, categoria: item.categoria });
    document.getElementById('addItemRowBtn').style.display = 'none';

    document.getElementById('sheetTitle').textContent = 'Editar artículo';
    document.getElementById('saveBtnText').textContent = 'Guardar cambios';

    openSheet();
  }

  document.getElementById('openNewCatBtn').addEventListener('click', function(){
    var row = document.getElementById('newCatRow');
    row.style.display = (row.style.display === 'none') ? 'flex' : 'none';
    if(row.style.display === 'flex'){ document.getElementById('fNuevaCategoria').focus(); }
  });

  document.getElementById('confirmNewCat').addEventListener('click', async function(){
    var input = document.getElementById('fNuevaCategoria');
    var name = input.value.trim();
    if(!name){ showToast('Escribí un nombre para la categoría'); return; }
    var exists = categories.some(function(c){ return c.toLowerCase() === name.toLowerCase(); });
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
    var cliente = document.getElementById('fCliente').value.trim();
    var tercero = document.getElementById('fTercero').value.trim();

    if(!cliente){ showToast('Falta el nombre del cliente'); return; }
    if(formState.retira === 'otro' && !tercero){ showToast('Falta el nombre de quien retira'); return; }

    var rowEls = document.querySelectorAll('#itemRowsContainer .item-row');
    if(rowEls.length === 0){ showToast('Agregá al menos un artículo'); return; }

    var items = [];
    for(var i = 0; i < rowEls.length; i++){
      var articulo = rowEls[i].querySelector('.row-articulo').value.trim();
      var precio = parseFloat(rowEls[i].querySelector('.row-precio').value);
      var categoria = rowEls[i].querySelector('.row-categoria').value || 'Sin categoría';
      if(!articulo){ showToast('Falta el nombre del artículo ' + (i + 1)); return; }
      if(isNaN(precio) || precio <= 0){ showToast('Precio inválido en el artículo ' + (i + 1)); return; }
      items.push({ articulo: articulo, precio: precio, categoria: categoria });
    }

    var saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;

    try{
      if(editingSaleId){
        var saleData = {
          cliente: cliente,
          articulo: items[0].articulo,
          precio: items[0].precio,
          pagado: formState.pagado,
          retira: formState.retira,
          tercero: formState.retira === 'otro' ? tercero : '',
          categoria: items[0].categoria
        };
        var updRes = await sb.from('sales').update(saleData).eq('id', editingSaleId).select();
        if(updRes.error) throw updRes.error;
        var idx = sales.findIndex(function(s){ return s.id === editingSaleId; });
        if(idx !== -1){ sales[idx] = mapRowToSale(updRes.data[0]); }
        await persistClientIfNew(cliente);
        render();
        closeSheet();
        showToast('Artículo actualizado');
      }else{
        var batch = items.map(function(it){
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
        var res = await sb.from('sales').insert(batch).select();
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
    var today = new Date().toISOString().slice(0,10);
    exportSalesToCSV(sales, 'feritapp-historial-completo-' + today + '.csv');
    showToast('CSV descargado');
  }
  document.getElementById('exportCsvBtn').addEventListener('click', handleManualExport);
  document.getElementById('exportCsvBtn2').addEventListener('click', handleManualExport);

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
  var SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  var voiceSupported = !!SpeechRec;
  if(!voiceSupported){
    document.getElementById('voiceWarning').innerHTML =
      '<div class="voice-warning">El dictado por voz no está disponible en este navegador. Probá abrir la app con Chrome en Android para usar el micrófono, o cargá los datos escribiendo directamente.</div>';
    document.querySelectorAll('.mic-btn').forEach(function(b){ b.style.display = 'none'; });
  }

  var NUM_WORDS = {
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
    var clean = stripAccents(text.toLowerCase())
      .replace(/pesos|peso|con\s*\d+\s*centavos?/g, ' ')
      .replace(/[^a-z0-9\s]/g,' ');
    var words = clean.split(/\s+/).filter(Boolean);
    var total = 0, current = 0, found = false;
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
    var digitMatch = transcript.replace(/[.,](?=\d{3}\b)/g,'').match(/\d+/g);
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
    var targetId = btn.getAttribute('data-target');
    if(targetId){ return document.getElementById(targetId); }
    var rowId = btn.getAttribute('data-row');
    var field = btn.getAttribute('data-field');
    if(rowId && field){
      var rowEl = document.querySelector('[data-row-id="' + rowId + '"]');
      if(rowEl){ return rowEl.querySelector('.row-' + field); }
    }
    return null;
  }

  function startDictation(btn){
    if(!voiceSupported) return;
    var mode = btn.getAttribute('data-mode');
    var input = resolveDictationInput(btn);
    if(!input) return;

    var recognition = new SpeechRec();
    recognition.lang = 'es-AR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    btn.classList.add('listening');

    recognition.onresult = function(event){
      var transcript = event.results[0][0].transcript;
      if(mode === 'number'){
        var parsed = extractPrice(transcript);
        if(parsed !== null){
          input.value = parsed;
        }else{
          showToast('No entendí el número, escribilo manualmente');
        }
      }else{
        var cap = transcript.charAt(0).toUpperCase() + transcript.slice(1);
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
      var input = document.getElementById(btn.getAttribute('data-target'));
      if(!input) return;
      var showing = input.type === 'text';
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
  var installBanner = document.getElementById('installBanner');
  var menuInstallBtn = document.getElementById('menuInstallBtn');
  var deferredInstallPrompt = null;

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
