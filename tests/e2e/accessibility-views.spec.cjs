const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function openAuthenticatedApp(page, themeChoice = 'light') {
  await page.addInitScript(choice => { localStorage.setItem('feritapp-theme', choice); }, themeChoice);
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


test('authenticated views and new-sale form have no serious or critical WCAG 2.1 A/AA violations in dark theme', async ({ page }) => {
  await openAuthenticatedApp(page, 'dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await auditView(page, '#viewDashboard', 'dark_dashboard');

  await navigateToView(page, 'sales', 1280);
  await auditView(page, '#viewSales', 'dark_sales_clients');

  await page.locator('#sidebarOpenSheet').click();
  await expect(page.locator('#sheet')).toHaveClass(/open/);
  await auditView(page, '#sheet', 'dark_new_sale_form');

  // El scrim queda detrás del panel; cerramos mediante su manejador sin intentar
  // hacer clic físicamente a través del panel superpuesto.
  await page.locator('#scrim').evaluate(element => element.click());
  await navigateToView(page, 'deliveries', 1280);
  await auditView(page, '#viewDeliveries', 'dark_deliveries');

  await navigateToView(page, 'settings', 1280);
  await auditView(page, '#viewSettings', 'dark_settings');
  await page.locator('#viewSettings [data-settings="appearance"]').click();
  await expect(page.locator('#settingsPanelAppearance')).toBeVisible();
  await auditView(page, '#settingsPanelAppearance', 'dark_appearance');
});

test('new-sale form exposes labeled controls and supports keyboard traversal', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.locator('#sidebarOpenSheet').click();
  await expect(page.locator('#sheet')).toHaveClass(/open/);

  const unlabeled = await page.locator('#sheet input, #sheet select, #sheet textarea').evaluateAll(elements =>
    elements.filter(element => {
      if (element.type === 'hidden' || element.disabled) return false;
      const id = element.id;
      const hasLabel = (id && document.querySelector('label[for="' + CSS.escape(id) + '"]')) ||
        element.closest('label') || element.getAttribute('aria-label') ||
        element.getAttribute('aria-labelledby');
      return !hasLabel;
    }).map(element => ({ tag: element.tagName, id: element.id, type: element.type }))
  );
  expect(unlabeled, 'all active form controls in the new-sale sheet must have an accessible name').toEqual([]);

  await page.locator('#fCliente').focus();
  await expect(page.locator('#fCliente')).toBeFocused();
  await page.keyboard.press('Tab');

  // El control de dictado sólo participa del recorrido si el navegador lo soporta.
  const clientMic = page.locator('#sheet .mic-btn[data-target="fCliente"]');
  if (await clientMic.isVisible()) {
    await expect(clientMic).toBeFocused();
    await page.keyboard.press('Tab');
  }

  await expect(page.locator('#openNewCatBtn')).toBeFocused();
  await page.keyboard.press('Tab');

  // Con un único artículo, el botón "Quitar" se oculta intencionalmente.
  await expect(page.locator('#itemRowsContainer .row-articulo')).toBeFocused();

  // El micrófono de artículo es un control intermedio cuando SpeechRecognition está disponible.
  const articleMic = page.locator('#itemRowsContainer .item-field-name .mic-btn');
  if (await articleMic.isVisible()) {
    await page.keyboard.press('Tab');
    await expect(articleMic).toBeFocused();
    await page.keyboard.press('Tab');
  } else {
    await page.keyboard.press('Tab');
  }

  await expect(page.locator('#itemRowsContainer .row-precio')).toBeFocused();

  // El micrófono de precio está después del input; verificamos avance y retorno.
  const priceMic = page.locator('#itemRowsContainer .item-field-price .mic-btn');
  if (await priceMic.isVisible()) {
    await page.keyboard.press('Tab');
    await expect(priceMic).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#itemRowsContainer .row-precio')).toBeFocused();
  }

  // En sentido inverso, desde precio se vuelve primero al micrófono de artículo.
  await page.keyboard.press('Shift+Tab');
  if (await articleMic.isVisible()) {
    await expect(articleMic).toBeFocused();
    await page.keyboard.press('Shift+Tab');
  }
  await expect(page.locator('#itemRowsContainer .row-articulo')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#openNewCatBtn')).toBeFocused();
});


test('desktop views share the same centered content axis as the header brand', async ({ page }) => {
  await openAuthenticatedApp(page);

  async function expectCenteredOnBrand(selectors, viewName) {
    const result = await page.evaluate((targets) => {
      const brand = document.querySelector('#appRoot > header > .brand-lockup');
      const brandRect = brand.getBoundingClientRect();
      const brandCenter = brandRect.left + brandRect.width / 2;
      return targets
        .map(selector => {
          const element = document.querySelector(selector);
          if (!element || element.getClientRects().length === 0) return null;
          const rect = element.getBoundingClientRect();
          return { selector, delta: Math.abs((rect.left + rect.width / 2) - brandCenter) };
        })
        .filter(Boolean);
    }, selectors);
    expect(result.length, viewName + ' must expose measurable content containers').toBeGreaterThan(0);
    for (const item of result) {
      expect(item.delta, viewName + ' ' + item.selector + ' must share the header brand center').toBeLessThanOrEqual(1);
    }
  }

  for (const width of [1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await navigateToView(page, 'dashboard', width);

    await expectCenteredOnBrand([
      '#viewDashboard > .ticket-wrap',
      '#viewDashboard > .section-block'
    ], 'Inicio');

    await navigateToView(page, 'sales', width);
    await expectCenteredOnBrand(['#viewSales > .view-hero', '#viewSales > .section-block'], 'Ventas');

    await page.evaluate(() => {
      document.querySelector('#viewSales').style.display = 'none';
      document.querySelector('#viewClients').style.display = 'block';
    });
    await expectCenteredOnBrand(['#viewClients > .view-hero', '#viewClients > .section-block'], 'Clientes');

    await navigateToView(page, 'deliveries', width);
    await expectCenteredOnBrand(['#viewDeliveries > .view-hero', '#viewDeliveries > .section-block'], 'Entregas');

    await page.locator('#sidebar [data-view="ranking"]').click();
    await expectCenteredOnBrand(['#viewRanking > .view-hero', '#viewRanking > .section-block'], 'Ranking');

    await navigateToView(page, 'settings', width);
    await expectCenteredOnBrand(['#viewSettings > #settingsMenu > .section-block'], 'Configuración');
    await page.locator('#viewSettings [data-settings="appearance"]').click();
    await expect(page.locator('#settingsPanelAppearance')).toBeVisible();
    await expectCenteredOnBrand(['#settingsPanelAppearance > .section-block'], 'Configuración / Apariencia');
  }
});
