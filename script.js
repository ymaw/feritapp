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
    var email = document.getElementById('gateEmail').value.trim();
    var pin = document.getElementById('gatePin').value;
    var ok = !!email && !!pin;
    document.getElementById('loginBtn').disabled = !ok;
    document.getElementById('signupBtn').disabled = !ok;
    document.getElementById('gateError').style.display = 'none';
  }
  ['gateEmail','gatePin','gatePinConfirm'].forEach(function(id){
    document.getElementById(id).addEventListener('input', checkGateInputs);
  });

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
      '📩 Te enviamos un correo de confirmación a <strong>' + email + '</strong>. Abrilo una sola vez para activar tu cuenta — de ahí en más, entrás directo con tu correo y contraseña, sin más correos.';
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
      '📩 Te enviamos un link para elegir una contraseña nueva a <strong>' + email + '</strong>. Abrilo desde este dispositivo.';
    document.getElementById('gateStep1').style.display = 'none';
    document.getElementById('gateSent').style.display = 'block';
  });

  document.getElementById('backToEmailBtn').addEventListener('click', function(){
    document.getElementById('gateSent').style.display = 'none';
    document.getElementById('gateStep1').style.display = 'block';
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

  function enterApp(user){
    if(entered) return;
    entered = true;
    document.getElementById('authGate').style.display = 'none';
    document.getElementById('appRoot').style.display = 'block';
    document.getElementById('sessionEmail').textContent = 'Ingresaste como ' + user.email;
    window.history.replaceState({}, document.title, window.location.pathname);
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

    try{
      var sessionRes = await sb.auth.getSession();
      if(sessionRes.data && sessionRes.data.session && sessionRes.data.session.user){
        enterApp(sessionRes.data.session.user);
      }
    }catch(e){
      console.error('Error leyendo la sesión de Supabase:', e);
    }

    sb.auth.onAuthStateChange(function(event, newSession){
      if(event === 'PASSWORD_RECOVERY'){
        showSetNewPinPrompt();
        return;
      }
      if(event === 'SIGNED_IN' && newSession && newSession.user){
        enterApp(newSession.user);
      }
    });
  }

  /* =========================================================
     REGISTRO DE VENTAS (datos persistidos en Supabase)
  ========================================================= */

  var sales = [];
  var categories = [];
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

    render();
    renderCategoryChips();
  }

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
    var diff = (day === 0 ? -6 : 1) - day; // move to monday
    date.setDate(date.getDate() + diff);
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
    var wrap = document.getElementById('monthCompare');
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
                 '<th>Artículo</th><th>Categoría</th><th>Cliente</th><th class="num">Precio</th><th></th>' +
               '</tr></thead><tbody>';
    items.forEach(function(item){
      var fechaTxt = new Date(item.fecha).toLocaleDateString('es-AR', {weekday:'short', day:'numeric', month:'short'});
      var cat = item.categoria || 'Sin categoría';
      var retiraHtml = item.retira === 'otro'
        ? '<div class="retira-info other">↳ Retira: ' + escapeHtml(item.tercero) + '</div>'
        : '<div class="retira-info same">↳ Retira el mismo cliente</div>';
      html += '<tr>' +
                '<td><div class="item-name">' + escapeHtml(item.articulo) + '</div><div class="item-meta">' + fechaTxt + '</div></td>' +
                '<td><span class="cat-badge"><span class="cat-dot" style="background:' + categoryColor(cat) + '"></span>' + escapeHtml(cat) + '</span></td>' +
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
      renderMonthComparison();
      renderClientSearch();
      return;
    }
    var html = '';
    pastKeys.forEach(function(k){
      var items = groups[k].slice().sort(function(a,b){ return new Date(b.fecha)-new Date(a.fecha); });
      var st = weekStats(items);
      var label = "Semana del " + formatRange(k);
      html += '<button class="week-toggle" data-week="' + k + '">' +
                '<span><span class="lbl">' + label + '</span><br><span class="sub">' + st.count + ' art. · ' + money(st.total) + '</span></span>' +
                '<span class="chev">▾</span>' +
              '</button>';
      html += '<div class="week-items" id="wk-' + k + '">' + renderSalesTable(items) + '</div>';
    });
    container.innerHTML = html;
    bindTableEvents(container);

    container.querySelectorAll('.week-toggle').forEach(function(btn){
      btn.addEventListener('click', function(){
        var wk = btn.getAttribute('data-week');
        btn.classList.toggle('open');
        document.getElementById('wk-' + wk).classList.toggle('open');
      });
    });

    renderMonthComparison();
    renderClientSearch();
  }

  function renderClientSearch(){
    var input = document.getElementById('clientSearch');
    var wrap = document.getElementById('clientSearchResults');
    if(!input || !wrap) return;
    var query = input.value.trim().toLowerCase();
    if(!query){ wrap.innerHTML = ''; return; }

    var matches = sales.filter(function(s){
      return (s.cliente || '').toLowerCase().indexOf(query) !== -1;
    });

    if(matches.length === 0){
      wrap.innerHTML = '<div class="empty-inline">No se encontraron ventas para ese nombre.</div>';
      return;
    }

    var st = weekStats(matches);
    var owedClass = st.pendiente > 0 ? '' : 'zero';
    var summaryHtml = '<div class="client-summary">' +
      '<div><div class="name">' + escapeHtml(query) + '</div><div class="owed-label">Debe abonar en total</div></div>' +
      '<div class="owed-value ' + owedClass + '">' + money(st.pendiente) + '</div>' +
    '</div>';

    var sorted = matches.slice().sort(function(a,b){ return new Date(b.fecha)-new Date(a.fecha); });
    wrap.innerHTML = summaryHtml + renderSalesTable(sorted, false);
    bindTableEvents(wrap);
  }

  document.getElementById('clientSearch').addEventListener('input', renderClientSearch);

  function escapeHtml(str){
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function showToast(msg){
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function(){ t.classList.remove('show'); }, 2200);
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
  var formState = { pagado: false, retira: 'cliente', categoria: '' };
  var editingSaleId = null;

  function resetForm(){
    document.getElementById('fCliente').value = '';
    document.getElementById('fArticulo').value = '';
    document.getElementById('fPrecio').value = '';
    document.getElementById('fTercero').value = '';
    formState.pagado = false; formState.retira = 'cliente';
    formState.categoria = categories.length ? categories[0] : '';
    document.querySelectorAll('.pago-opt').forEach(function(b){ b.classList.toggle('active', b.dataset.val === '0'); });
    document.querySelectorAll('.retira-opt').forEach(function(b){ b.classList.toggle('active', b.dataset.val === 'cliente'); });
    document.getElementById('terceroField').style.display = 'none';
    document.getElementById('newCatRow').style.display = 'none';
    document.getElementById('fNuevaCategoria').value = '';
    editingSaleId = null;
    document.getElementById('sheetTitle').textContent = 'Nueva venta';
    document.getElementById('saveBtnText').textContent = 'Guardar venta';
    renderCategoryChips();
  }

  function openEditSheet(item){
    editingSaleId = item.id;
    document.getElementById('fCliente').value = item.cliente;
    document.getElementById('fArticulo').value = item.articulo;
    document.getElementById('fPrecio').value = item.precio;
    document.getElementById('fTercero').value = item.tercero || '';

    formState.pagado = !!item.pagado;
    formState.retira = item.retira === 'otro' ? 'otro' : 'cliente';
    formState.categoria = item.categoria || (categories.length ? categories[0] : '');

    document.querySelectorAll('.pago-opt').forEach(function(b){ b.classList.toggle('active', b.dataset.val === (formState.pagado ? '1' : '0')); });
    document.querySelectorAll('.retira-opt').forEach(function(b){ b.classList.toggle('active', b.dataset.val === formState.retira); });
    document.getElementById('terceroField').style.display = (formState.retira === 'otro') ? 'block' : 'none';

    renderCategoryChips();

    document.getElementById('sheetTitle').textContent = 'Editar venta';
    document.getElementById('saveBtnText').textContent = 'Guardar cambios';

    openSheet();
  }

  /* ---------------- category chips ---------------- */
  function renderCategoryChips(){
    var wrap = document.getElementById('categoryChips');
    if(!wrap) return;
    if(!formState.categoria && categories.length){ formState.categoria = categories[0]; }
    var html = '';
    categories.forEach(function(cat){
      var active = (cat === formState.categoria) ? ' active' : '';
      html += '<button type="button" class="chip' + active + '" data-cat="' + escapeHtml(cat) + '">' +
                '<span class="dot" style="background:' + categoryColor(cat) + '"></span>' + escapeHtml(cat) +
              '</button>';
    });
    html += '<button type="button" class="chip add-chip" id="addCatChip">+ Nueva</button>';
    wrap.innerHTML = html;

    wrap.querySelectorAll('[data-cat]').forEach(function(chip){
      chip.addEventListener('click', function(){
        formState.categoria = chip.getAttribute('data-cat');
        document.getElementById('newCatRow').style.display = 'none';
        renderCategoryChips();
      });
    });
    var addChip = document.getElementById('addCatChip');
    if(addChip){
      addChip.addEventListener('click', function(){
        var row = document.getElementById('newCatRow');
        row.style.display = (row.style.display === 'none') ? 'flex' : 'none';
        if(row.style.display === 'flex'){ document.getElementById('fNuevaCategoria').focus(); }
      });
    }
  }

  document.getElementById('confirmNewCat').addEventListener('click', async function(){
    var input = document.getElementById('fNuevaCategoria');
    var name = input.value.trim();
    if(!name){ showToast('Escribí un nombre para la categoría'); return; }
    var exists = categories.some(function(c){ return c.toLowerCase() === name.toLowerCase(); });
    if(!exists){
      await persistNewCategory(name);
      categories.push(name);
    }
    formState.categoria = name;
    input.value = '';
    document.getElementById('newCatRow').style.display = 'none';
    renderCategoryChips();
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
    var articulo = document.getElementById('fArticulo').value.trim();
    var precio = parseFloat(document.getElementById('fPrecio').value);
    var tercero = document.getElementById('fTercero').value.trim();

    if(!cliente){ showToast('Falta el nombre del cliente'); return; }
    if(!articulo){ showToast('Falta el nombre del artículo'); return; }
    if(isNaN(precio) || precio <= 0){ showToast('Ingresá un precio válido'); return; }
    if(formState.retira === 'otro' && !tercero){ showToast('Falta el nombre de quien retira'); return; }

    var saleData = {
      cliente: cliente,
      articulo: articulo,
      precio: precio,
      pagado: formState.pagado,
      retira: formState.retira,
      tercero: formState.retira === 'otro' ? tercero : '',
      categoria: formState.categoria || 'Sin categoría'
    };

    var saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;

    try{
      if(editingSaleId){
        var updRes = await sb.from('sales').update(saleData).eq('id', editingSaleId).select();
        if(updRes.error) throw updRes.error;
        var idx = sales.findIndex(function(s){ return s.id === editingSaleId; });
        if(idx !== -1){ sales[idx] = mapRowToSale(updRes.data[0]); }
        render();
        closeSheet();
        showToast('Venta actualizada');
      }else{
        var res = await sb.from('sales').insert([saleData]).select();
        if(res.error) throw res.error;
        sales.unshift(mapRowToSale(res.data[0]));
        render();
        closeSheet();
        showToast('Venta guardada');
      }
    }catch(e){
      showToast('No se pudo guardar. Probá de nuevo.');
    }finally{
      saveBtn.disabled = false;
    }
  });

  /* ---------------- reset all ---------------- */
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
      return parseInt(digitMatch.join(''), 10);
    }
    return wordsToNumber(transcript);
  }

  function startDictation(btn){
    if(!voiceSupported) return;
    var targetId = btn.getAttribute('data-target');
    var mode = btn.getAttribute('data-mode');
    var input = document.getElementById(targetId);

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

  /* ---------------- init ---------------- */
  initGate();

  /* ---------------- PWA: registrar service worker ---------------- */
  if('serviceWorker' in navigator){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').catch(function(){ /* si falla, la app sigue funcionando igual */ });
    });
  }
});
