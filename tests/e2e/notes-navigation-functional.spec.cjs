const { test, expect } = require('@playwright/test');

async function openIsolatedApp(page) {
  await page.addInitScript(() => {
    const storageKey = 'feritapp-e2e-isolated-db';
    const initial = {
      sales: [],
      categories: [{ id: 'qa-category', name: 'Indumentaria' }],
      clients: [{ id: 'qa-client-1', name: 'Cliente de prueba' }],
      notes: [],
      note_labels: [],
      user_settings: [{
        user_id: 'qa-user',
        week_start_day: 1,
        notify_enabled: false,
        notify_days_overdue: 4,
        receipt_message: 'Gracias por tu compra',
        store_name: 'Tienda QA',
        avatar_url: '',
        navigation_slots: ['dashboard', 'sales', 'deliveries', 'notes']
      }]
    };
    if (!localStorage.getItem(storageKey)) localStorage.setItem(storageKey, JSON.stringify(initial));
    const db = JSON.parse(localStorage.getItem(storageKey));
    const persist = () => localStorage.setItem(storageKey, JSON.stringify(db));
    let nextId = 1;

    function makeClient(table) {
      let action = 'select';
      let payload = null;
      let filters = [];
      const builder = {
        select() { return this; },
        insert(value) { action = 'insert'; payload = value; return this; },
        update(value) { action = 'update'; payload = value; return this; },
        delete() { action = 'delete'; return this; },
        upsert(value) { action = 'upsert'; payload = value; return this; },
        eq(column, value) { filters.push([column, value]); return this; },
        neq() { return this; },
        order() { return this; },
        limit() { return this; },
        gte() { return this; },
        lte() { return this; },
        in() { return this; },
        is() { return this; },
        async maybeSingle() {
          const result = await execute();
          return { data: result.data[0] || null, error: result.error };
        },
        async single() {
          const result = await execute();
          return { data: result.data[0] || null, error: result.error };
        },
        then(resolve, reject) { return execute().then(resolve, reject); }
      };

      async function execute() {
        db[table] ||= [];
        const rows = db[table];
        const matches = row => filters.every(([column, value]) => row[column] === value);
        if (action === 'select') return { data: rows.filter(matches).map(row => ({ ...row })), error: null };
        if (action === 'insert') {
          const values = Array.isArray(payload) ? payload : [payload];
          const inserted = values.map(value => ({
            id: value.id || 'qa-row-' + nextId++,
            created_at: value.created_at || new Date().toISOString(),
            updated_at: value.updated_at || new Date().toISOString(),
            ...value
          }));
          rows.push(...inserted);
          persist();
          return { data: inserted.map(row => ({ ...row })), error: null };
        }
        if (action === 'update') {
          const updated = rows.filter(matches).map(row => Object.assign(row, payload));
          persist();
          return { data: updated.map(row => ({ ...row })), error: null };
        }
        if (action === 'delete') {
          const removed = rows.filter(matches);
          db[table] = rows.filter(row => !matches(row));
          persist();
          return { data: removed, error: null };
        }
        if (action === 'upsert') {
          const current = rows[0];
          if (current) Object.assign(current, payload);
          else rows.push({ user_id: 'qa-user', ...payload });
          persist();
          return { data: rows.map(row => ({ ...row })), error: null };
        }
        return { data: [], error: null };
      }
      return builder;
    }

    window.supabase = {
      createClient: () => ({
        auth: {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
          getSession: async () => ({ data: { session: null } }),
          signInWithPassword: async () => ({
            error: null,
            data: { user: { id: 'qa-user', email: 'qa@example.test' } }
          }),
          signOut: async () => ({ error: null })
        },
        from: makeClient
      })
    };
  });

  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#authGate')).toBeVisible();
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.locator('#gatePin').fill('Clave123!');
  await page.locator('#loginBtn').click();
  await expect(page.locator('#appRoot')).toBeVisible();
  await expect(page.locator('#viewDashboard')).toBeVisible();
}

async function openNotes(page) {
  await page.locator('#sidebar [data-view="notes"]').click();
  await expect(page.locator('#viewNotes')).toBeVisible();
}

async function openNavigationSettings(page) {
  // En viewport móvil, Configuración se alcanza desde el menú Más; el sidebar está oculto.
  await page.locator('#headerMoreBtn').click();
  await expect(page.locator('#menuDropdown')).toBeVisible();
  await page.locator('#menuSettingsBtn').click();
  await expect(page.locator('#viewSettings')).toBeVisible();
  await page.locator('#viewSettings [data-settings="personalization"]').click();
  await expect(page.locator('#settingsPanelPersonalization')).toBeVisible();
}

test('Notes supports create, optional client/reminder, search, edit and delete in isolated storage', async ({ page }) => {
  page.on('dialog', dialog => dialog.accept());
  await openIsolatedApp(page);
  await openNotes(page);

  await page.locator('#newNoteBtn').click();
  await page.locator('#createNoteTypeBtn').click();
  await page.locator('#noteLabelName').fill('Retiro');
  await page.locator('#saveNoteLabelBtn').click();
  await page.locator('#createNoteImportanceBtn').click();
  await page.locator('#noteLabelName').fill('Urgente');
  await page.locator('#noteLabelColor').fill('#EF4444');
  await page.locator('#saveNoteLabelBtn').click();
  await page.locator('#noteType').selectOption({label:'Retiro'});
  await page.locator('#noteImportance').selectOption({label:'Urgente'});
  await page.locator('#noteContent').fill('Recordatorio libre para revisar el inventario');
  await page.locator('#saveNoteBtn').click();
  const freeNote = page.locator('.note-card').filter({ hasText: 'Recordatorio libre para revisar el inventario' });
  await expect(freeNote).toBeVisible();
  await expect(freeNote).not.toContainText('Cliente de prueba');
  await expect(freeNote).toContainText('Retiro');
  await expect(freeNote).toContainText('Urgente');
  await expect(freeNote).toHaveAttribute('style',/--note-type-color:/);

  await page.locator('#newNoteBtn').click();
  await page.locator('#noteContent').fill('Llamar al cliente por el pedido');
  await page.locator('#noteClient').selectOption('qa-client-1');
  await page.locator('#noteReminderEnabled').check();
  const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const date = [future.getFullYear(), String(future.getMonth() + 1).padStart(2, '0'), String(future.getDate()).padStart(2, '0')].join('-');
  await page.locator('#noteReminderDate').fill(date);
  await page.locator('#noteReminderTime').fill('12:30');
  await page.locator('#saveNoteBtn').click();

  const linkedNote = page.locator('.note-card').filter({ hasText: 'Llamar al cliente por el pedido' });
  await expect(linkedNote).toBeVisible();
  await expect(linkedNote).toContainText('Cliente de prueba');
  await expect(linkedNote.locator('.note-chip')).toHaveCount(2);

  await page.locator('#notesSearch').fill('cliente de prueba');
  await expect(linkedNote).toBeVisible();
  await expect(freeNote).toHaveCount(0);
  await page.locator('#notesSearch').fill('inventario');
  await expect(freeNote).toBeVisible();

  await freeNote.locator('[data-note-edit]').click();
  await expect(page.locator('#notesEditorTitle')).toHaveText('Editar nota');
  await page.locator('#noteContent').fill('Inventario revisado y actualizado');
  await page.locator('#saveNoteBtn').click();
  await expect(page.locator('.note-card').filter({ hasText: 'Inventario revisado y actualizado' })).toBeVisible();

  // Quitar el filtro de búsqueda para volver a mostrar la nota vinculada antes de eliminarla.
  await page.locator('#notesSearch').fill('');
  await expect(linkedNote).toBeVisible();
  await linkedNote.locator('[data-note-delete]').click();
  await expect(page.locator('.note-card').filter({ hasText: 'Llamar al cliente por el pedido' })).toHaveCount(0);
});

test('navigation preferences persist and reset only applies after saving', async ({ page }) => {
  // Esta cobertura verifica la barra inferior y el menú móvil, no el sidebar de escritorio.
  await page.setViewportSize({ width: 390, height: 844 });
  await openIsolatedApp(page);
  await openNavigationSettings(page);

  await page.locator('#navigationSlot2').selectOption('ranking');
  await page.locator('#saveNavigationBtn').click();
  await expect(page.locator('#bottomNav [data-nav-slot="2"]')).toHaveAttribute('data-nav-key', 'ranking');

  await page.reload();
  await expect(page.locator('#authGate')).toBeVisible();
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.locator('#gatePin').fill('Clave123!');
  await page.locator('#loginBtn').click();
  await expect(page.locator('#appRoot')).toBeVisible();
  await expect(page.locator('#bottomNav [data-nav-slot="2"]')).toHaveAttribute('data-nav-key', 'ranking');

  await page.locator('#headerMoreBtn').click();
  await expect(page.locator('#menuDropdown')).toBeVisible();
  await expect(page.locator('#moreDynamicItems [data-nav-key="ranking"]')).toHaveCount(0);
  await expect(page.locator('#moreDynamicItems [data-nav-key="sales"]')).toHaveCount(1);
  await page.locator('#headerMoreBtn').click();

  await openNavigationSettings(page);
  await page.locator('#resetNavigationBtn').click();
  await expect(page.locator('#navigationSlot2')).toHaveValue('sales');
  await expect(page.locator('#bottomNav [data-nav-slot="2"]')).toHaveAttribute('data-nav-key', 'ranking');
  await page.locator('#saveNavigationBtn').click();
  await expect(page.locator('#bottomNav [data-nav-slot="2"]')).toHaveAttribute('data-nav-key', 'sales');
});
