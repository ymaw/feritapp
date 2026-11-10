from pathlib import Path
p=Path('/mnt/data/v12_5_work/script.js'); s=p.read_text()
# Remove obsolete Messenger association state and loading map
s=s.replace('  let clientMessengerUsers = {};\n','').replace("  let messengerEditingClient = '';\n",'')
s=s.replace("      clients = (clientsRes.data || []).map(function(c){ if(c.messenger_username) clientMessengerUsers[c.name] = c.messenger_username; return c.name; });", "      clients = (clientsRes.data || []).map(function(c){ return c.name; });")
# Remove messenger association modal logic entirely, replacing with copy-only helper
start=s.index('  function normalizeMessengerTarget(value){')
end=s.index('  function openClientDetails(name){', start)
copyfn='''  async function copyClientName(name){
    let copied = false;
    try{
      if(navigator.clipboard && window.isSecureContext){
        await navigator.clipboard.writeText(name);
        copied = true;
      }else{
        let input = document.createElement('textarea');
        input.value = name;
        input.setAttribute('readonly', '');
        input.style.position = 'fixed'; input.style.opacity = '0'; input.style.pointerEvents = 'none';
        document.body.appendChild(input); input.select();
        copied = document.execCommand('copy');
        document.body.removeChild(input);
      }
    }catch(e){ copied = false; }
    showToast(copied ? 'Nombre copiado. Pegalo en el buscador de Messenger.' : 'No se pudo copiar automáticamente. Mantené presionado el nombre para copiarlo.');
  }

'''
s=s[:start]+copyfn+s[end:]
# Remove messenger modal HTML event hooks are in removed block; render list markup update
s=s.replace("'<span class=\"client-list-copy\"><strong>' + escapeHtml(name) + '</strong><small>' + (clientMessengerUsers[name] ? 'Contacto asociado' : 'Ver compras y opciones') + '</small></span><span class=\"client-row-chevron\">›</span></button>' +\n                '<div class=\"client-row-actions\"><button type=\"button\" class=\"client-inline-messenger\" data-messenger-client=\"' + escapeHtml(name) + '\" aria-label=\"Vincular o abrir Messenger para ' + escapeHtml(name) + '\">◉ <span>' + (clientMessengerUsers[name] ? 'Messenger' : 'Vincular') + '</span></button><button type=\"button\" class=\"client-inline-share\" data-share-client=\"' + escapeHtml(name) + '\" aria-label=\"Compartir comprobante de ' + escapeHtml(name) + '\">↗</button>",
"'<span class=\"client-list-copy\"><strong>' + escapeHtml(name) + '</strong><small>Ver compras y opciones</small></span><span class=\"client-row-chevron\">›</span></button>' +\n                '<div class=\"client-row-actions\"><button type=\"button\" class=\"client-inline-copy\" data-copy-client=\"' + escapeHtml(name) + '\" aria-label=\"Copiar nombre de ' + escapeHtml(name) + '\" title=\"Copiar nombre\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"8\" y=\"8\" width=\"12\" height=\"12\" rx=\"2\"/><path d=\"M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3\"/></svg></button><button type=\"button\" class=\"client-inline-share\" data-share-client=\"' + escapeHtml(name) + '\" aria-label=\"Compartir comprobante de ' + escapeHtml(name) + '\" title=\"Compartir comprobante\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 16V3m-5 5 5-5 5 5\"/><path d=\"M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6\"/></svg></button>")
# Replace listener blocks for old messenger actions
old="""    wrap.querySelectorAll('[data-messenger-client]').forEach(function(btn){
      btn.addEventListener('click', function(){ openMessengerEditor(btn.getAttribute('data-messenger-client')); });
    });
    wrap.querySelectorAll('[data-open-messenger]').forEach(function(btn){
      btn.addEventListener('click', function(){ openMessengerForClient(btn.getAttribute('data-open-messenger')); });
    });
"""
s=s.replace(old,"""    wrap.querySelectorAll('[data-copy-client]').forEach(function(btn){
      btn.addEventListener('click', function(){ copyClientName(btn.getAttribute('data-copy-client')); });
    });
""")
# Detail actions replace
old="""    let target = clientMessengerUsers[name] || '';
    let messengerLabel = target ? (target.indexOf('search:')===0 ? 'Buscar en Messenger' : 'Abrir Messenger') : 'Vincular Messenger';
"""
s=s.replace(old,'')
s=s.replace("'<div class=\"client-detail-actions\"><button type=\"button\" class=\"messenger-action-btn\" data-open-messenger=\"' + escapeHtml(name) + '\">◉ ' + messengerLabel + '</button><button type=\"button\" class=\"share-client-btn\" data-share-client=\"' + escapeHtml(name) + '\">↗ Compartir comprobante</button></div>'",
"'<div class=\"client-detail-actions\"><button type=\"button\" class=\"copy-client-name-btn\" data-copy-client=\"' + escapeHtml(name) + '\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"8\" y=\"8\" width=\"12\" height=\"12\" rx=\"2\"/><path d=\"M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3\"/></svg> Copiar nombre</button><button type=\"button\" class=\"share-client-btn\" data-share-client=\"' + escapeHtml(name) + '\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M12 16V3m-5 5 5-5 5 5\"/><path d=\"M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6\"/></svg> Compartir comprobante</button></div>" )
s=s.replace("    panel.querySelector('[data-open-messenger]').addEventListener('click', function(){ openMessengerForClient(name); });", "    panel.querySelector('[data-copy-client]').addEventListener('click', function(){ copyClientName(name); });")
# Refresh client row action styles class names are handled in CSS below
# Canvas receipt redesign: branding header, title, item lines, total card
s=s.replace("    const NAVY = '#01172F', GRAY = '#8892a0', ACCENT = '#446DF6';", "    const NAVY = '#17164A', GRAY = '#727A98', ACCENT = '#6547F5', PALE = '#F1EEFF', LINE = '#E4E0FA';")
s=s.replace("    const headerH = 110;", "    const headerH = 142;")
s=s.replace("    ctx.fillStyle = '#ffffff';\n    ctx.fillRect(0, 0, W, H);\n    ctx.fillStyle = ACCENT;\n    ctx.fillRect(0, 0, W, 8);\n\n    let y = 46;\n    ctx.textAlign = 'left';\n    ctx.fillStyle = NAVY;\n    ctx.font = 'bold 22px Arial';\n    ctx.fillText('Detalle de compra', PADDING, y);\n\n    y += 28;\n    ctx.font = '13px Arial';\n    ctx.fillStyle = GRAY;\n    ctx.fillText(new Date().toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' }), PADDING, y);\n\n    y += 24;\n    drawDashedLine(ctx, PADDING, y, W - PADDING);\n\n    y += 32;", "    ctx.fillStyle = '#F8F7FF';\n    ctx.fillRect(0, 0, W, H);\n    ctx.fillStyle = '#FFFFFF';\n    ctx.fillRect(18, 18, W - 36, H - 36);\n    ctx.fillStyle = ACCENT;\n    ctx.fillRect(18, 18, W - 36, 8);\n    ctx.fillStyle = PALE;\n    ctx.fillRect(18, 26, W - 36, 92);\n\n    let y = 64;\n    ctx.textAlign = 'left';\n    ctx.fillStyle = ACCENT;\n    ctx.font = 'bold 27px Arial';\n    ctx.fillText('ferit', PADDING, y);\n    let brandWidth = ctx.measureText('ferit').width;\n    ctx.fillStyle = NAVY;\n    ctx.fillText('App', PADDING + brandWidth, y);\n    y += 27;\n    ctx.font = 'bold 15px Arial';\n    ctx.fillStyle = NAVY;\n    ctx.fillText('COMPROBANTE DE COMPRA', PADDING, y);\n    y += 22;\n    ctx.font = '12px Arial';\n    ctx.fillStyle = GRAY;\n    ctx.fillText(new Date().toLocaleDateString('es-AR', { day:'numeric', month:'long', year:'numeric' }), PADDING, y);\n\n    y = 151;\n    ctx.fillStyle = GRAY;\n    ctx.font = 'bold 12px Arial';")
s=s.replace("    ctx.fillText('ARTÍCULO', PADDING, y);", "    ctx.fillText('ARTÍCULO', PADDING, y);")
s=s.replace("    y += 22;\n    ctx.font = '15px Arial';", "    y += 22;\n    ctx.font = '15px Arial';")
s=s.replace("      ctx.fillStyle = NAVY;\n      ctx.fillText(truncateCanvasText(ctx, it.articulo, 330), PADDING, y);", "      ctx.fillStyle = NAVY;\n      ctx.fillText(truncateCanvasText(ctx, it.articulo, 330), PADDING, y);")
s=s.replace("      total += Number(it.precio) || 0;\n      y += LINE_H;", "      total += Number(it.precio) || 0;\n      y += LINE_H;\n      ctx.strokeStyle = LINE; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(PADDING, y - 13); ctx.lineTo(W - PADDING, y - 13); ctx.stroke();")
s=s.replace("    drawDashedLine(ctx, PADDING, y, W - PADDING);\n    y += 36;\n\n    ctx.textAlign = 'left';\n    ctx.font = 'bold 19px Arial';\n    ctx.fillStyle = NAVY;", "    ctx.fillStyle = PALE; ctx.fillRect(PADDING - 8, y - 15, W - PADDING * 2 + 16, 52);\n    y += 18;\n\n    ctx.textAlign = 'left';\n    ctx.font = 'bold 19px Arial';\n    ctx.fillStyle = NAVY;")
# remove messenger modal markup
h=Path('/mnt/data/v12_5_work/index.html'); html=h.read_text()
start=html.index('<div id="messengerLinkModal"')
end=html.index('<div class="receipt-edit-scrim"',start)
html=html[:start]+html[end:]
# Receipt preview semantic redesign
html=html.replace('<div class="receipt-edit-heading"><span class="receipt-edit-icon">▤</span><div><h2 id="receiptEditTitle">Comprobante de venta</h2><p>Revisá el mensaje antes de compartir.</p></div><button type="button" id="closeReceiptEdit" class="icon-close-btn" aria-label="Cerrar">×</button></div>', '<div class="receipt-edit-heading"><span class="receipt-edit-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M14 3v5h5M8 13h8M8 17h8"/></svg></span><div><p class="receipt-eyebrow">VENTA LISTA PARA COMPARTIR</p><h2 id="receiptEditTitle">Comprobante de compra</h2><p>Así lo verá tu cliente.</p></div><button type="button" id="closeReceiptEdit" class="icon-close-btn" aria-label="Cerrar">×</button></div>')
html=html.replace('<div class="receipt-preview-brand">ferit<span>App</span></div>\n      <div class="receipt-preview-title">DETALLE DE COMPRA</div>', '<div class="receipt-preview-brand"><span class="receipt-brand-mark">f</span><span class="receipt-brand-name">ferit<strong>App</strong></span><span class="receipt-preview-badge">COMPROBANTE</span></div>\n      <div class="receipt-preview-title">Resumen de tu compra</div>')
html=html.replace('<div class="receipt-preview-message-label">Mensaje</div>', '<div class="receipt-preview-message-label"><span>✦</span> Mensaje de la tienda</div>')
html=html.replace('<label class="receipt-message-label" for="receiptShareMessage">Mensaje incluido en el comprobante</label>', '<div class="receipt-message-editor-head"><span class="receipt-message-editor-icon">✎</span><label class="receipt-message-label" for="receiptShareMessage">Personalizá el mensaje</label></div>')
h.write_text(html); p.write_text(s)
