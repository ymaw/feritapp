const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function openAuthenticatedApp(page) {
  await page.addInitScript(() => {
    const today = new Date().toISOString();
    const dataByTable = {
      sales: [{
        id: 'qa-sale-0001', fecha: today, semana_asignada: null,
        cliente: 'Cliente QA', articulo: 'Artículo QA', precio: 1200,
        pagado: false, retira: 'cliente', tercero: '',
        categoria: 'Indumentaria', entregado: false, entregado_en: null
      }],
      categories: [{ name: 'Indumentaria' }],
      clients: [{ name: 'Cliente QA' }],
      user_settings: {
        week_start_day: 1, notify_enabled: false, notify_days_overdue: 4,
        receipt_message: 'Gracias por tu compra', store_name: 'Tienda QA', avatar_url: ''
      }
    };
    window.supabase = {
      createClient: () => ({
        auth: {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
          getSession: async () => ({ data: { session: null } }),
          signInWithPassword: async () => ({
            error: null, data: { user: { id: 'qa-user', email: 'qa@example.test' } }
          }),
          signOut: async () => ({ error: null })
        },
        from: table => {
          const result = { data: dataByTable[table] ?? [], error: null };
          const builder = {
            select() { return this; }, eq() { return this; }, neq() { return this; },
            order() { return this; }, limit() { return this; }, gte() { return this; },
            lte() { return this; }, in() { return this; }, is() { return this; },
            insert() { return Promise.resolve({ data: [], error: null }); },
            update() { return this; }, delete() { return this; },
            maybeSingle() { return Promise.resolve(result); },
            single() { return Promise.resolve(result); },
            then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); }
          };
          return builder;
        }
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


async function navigateToView(page, view, width) {
  if (width <= 700) {
    if (['dashboard', 'sales', 'deliveries'].includes(view)) {
      await page.locator('#bottomNav [data-view="' + view + '"]').click();
    } else if (view === 'settings') {
      await page.locator('#moreBtn').click();
      await expect(page.locator('#menuDropdown')).toBeVisible();
      await page.locator('#menuDropdown [data-view="settings"]').click();
    } else {
      throw new Error('No mobile navigation route is defined for view: ' + view);
    }
  } else {
    await page.locator('#sidebar [data-view="' + view + '"]').click();
  }
}

async function auditView(page, selector, name) {
  await expect(page.locator(selector)).toBeVisible();
  const results = await new AxeBuilder({ page })
    .include(selector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const severe = results.violations.filter(violation =>
    violation.impact === 'critical' || violation.impact === 'serious'
  );
  console.log('FERITAPP_AXE_' + name.toUpperCase() + ' ' + JSON.stringify(
    results.violations.map(({ id, impact, help, nodes }) => ({
      id, impact, help, nodes: nodes.map(node => ({
        target: node.target,
        html: node.html,
        failureSummary: node.failureSummary
      }))
    }))
  ));
  expect(severe, name + ' must not contain serious or critical WCAG violations').toEqual([]);
}

test('main authenticated views have no serious or critical WCAG 2.1 A/AA violations', async ({ page }) => {
  await openAuthenticatedApp(page);
  await auditView(page, '#viewDashboard', 'dashboard');

  // Clientes está integrado en Ventas; no existe una ruta independiente en la navegación.
  await navigateToView(page, 'sales', 1280);
  await auditView(page, '#viewSales', 'sales_clients');

  await navigateToView(page, 'deliveries', 1280);
  await auditView(page, '#viewDeliveries', 'deliveries');

  await navigateToView(page, 'settings', 1280);
  await auditView(page, '#viewSettings', 'settings');
  await page.locator('#viewSettings [data-settings="appearance"]').click();
  await expect(page.locator('#settingsPanelAppearance')).toBeVisible();
  const appearanceResults = await new AxeBuilder({ page })
    .include('#settingsPanelAppearance')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const severeAppearance = appearanceResults.violations.filter(v =>
    v.impact === 'critical' || v.impact === 'serious'
  );
  console.log('FERITAPP_AXE_APPEARANCE ' + JSON.stringify(
    appearanceResults.violations.map(({ id, impact, help, nodes }) => ({
      id, impact, help, nodes: nodes.map(node => ({
        target: node.target, html: node.html, failureSummary: node.failureSummary
      }))
    }))
  ));
  expect(severeAppearance, 'appearance settings must not contain serious or critical WCAG violations').toEqual([]);
});

test('primary view navigation completes without layout overflow on desktop and mobile widths', async ({ page }) => {
  await openAuthenticatedApp(page);
  for (const width of [1280, 390, 360]) {
    await page.setViewportSize({ width, height: 844 });
    for (const view of ['sales', 'deliveries', 'dashboard', 'settings']) {
      const start = await page.evaluate(() => performance.now());
      await navigateToView(page, view, width);
      const selector = view === 'settings' ? '#viewSettings' : '#view' + view[0].toUpperCase() + view.slice(1);
      await expect(page.locator(selector)).toBeVisible();
      const elapsed = await page.evaluate(startTime => performance.now() - startTime, start);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth
      }));
      expect(elapsed, view + ' navigation should complete within 2.5 seconds').toBeLessThan(2500);
      expect(dimensions.document, view + ' must not cause horizontal page overflow at ' + width + 'px').toBeLessThanOrEqual(dimensions.viewport);
    }
  }
});
