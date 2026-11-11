const { test, expect } = require('@playwright/test');

const clientPayload = '<img data-xss-probe="client" src=x onerror="window.__xssExecuted=true"> Cliente QA';
const articlePayload = '<img data-xss-probe="article" src=x onerror="window.__xssExecuted=true"> Artículo QA';
const categoryPayload = '<img data-xss-probe="category" src=x onerror="window.__xssExecuted=true"> Categoría QA';
const pickupPayload = '<img data-xss-probe="pickup" src=x onerror="window.__xssExecuted=true"> Retira QA';

async function openAuthenticatedApp(page) {
  await page.addInitScript(({ client, article, category, pickup }) => {
    window.__xssExecuted = false;
    const today = new Date().toISOString();
    const rows = [{
      id: 'qa-sale-0001',
      fecha: today,
      semana_asignada: null,
      cliente: client,
      articulo: article,
      precio: 1200,
      pagado: false,
      retira: 'otro',
      tercero: pickup,
      categoria: category,
      entregado: false,
      entregado_en: null
    }];
    const dataByTable = {
      sales: rows,
      categories: [{ name: category }],
      clients: [{ name: client }],
      user_settings: {
        week_start_day: 1,
        notify_enabled: false,
        notify_days_overdue: 4,
        receipt_message: 'Gracias',
        store_name: 'Tienda QA',
        avatar_url: ''
      }
    };
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
        from: table => {
          const result = { data: dataByTable[table] || [], error: null };
          const builder = {
            select() { return this; },
            order() { return this; },
            maybeSingle() { return Promise.resolve(result); },
            insert() { return Promise.resolve({ data: [], error: null }); },
            then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); }
          };
          return builder;
        }
      })
    };
  }, {
    client: clientPayload,
    article: articlePayload,
    category: categoryPayload,
    pickup: pickupPayload
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
  await expect(page.locator('#dashboardTasks')).not.toBeEmpty();
}

test('user-controlled client and sale fields remain inert text when rendered', async ({ page }) => {
  await openAuthenticatedApp(page);

  await page.locator('#sidebar [data-view="sales"]').click();
  const sales = page.locator('#currentWeekTable');
  await expect(sales.locator('.sales-client-group')).toHaveCount(1);
  await expect(sales).toContainText(clientPayload);
  await expect(sales).toContainText(articlePayload);
  await expect(sales).toContainText(categoryPayload);
  await expect(sales).toContainText(pickupPayload);

  await expect(page.locator('[data-xss-probe]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__xssExecuted)).toBe(false);
});

async function expandFirstSalesClientGroup(page) {
  const group = page.locator('#currentWeekTable .sales-client-group').first();
  const panel = group.locator('.sales-client-group-content');
  if (await panel.isHidden()) {
    await group.locator('.sales-client-group-trigger').click();
  }
  await expect(panel).toBeVisible();
}

test('existing malicious sale values remain inert when opening the edit flow', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.locator('#sidebar [data-view="sales"]').click();
  await expandFirstSalesClientGroup(page);

  const editButton = page.locator('#currentWeekTable [data-add-client-sale]');
  await expect(editButton).toHaveAttribute('data-add-client-sale', clientPayload);
  await expect(editButton).not.toHaveAttribute('onerror');
  await editButton.click();
  const articleInput = page.locator('#itemRowsContainer .row-articulo').first();
  await expect(articleInput).toHaveValue(articlePayload);
  await expect(page.locator('#itemRowsContainer [data-xss-probe]')).toHaveCount(0);
  await expect(page.locator('[data-xss-probe]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__xssExecuted)).toBe(false);
});

test('receipt preview and editable message render untrusted text without creating markup', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.locator('#sidebar [data-view="sales"]').click();
  await expandFirstSalesClientGroup(page);

  const receiptButton = page.locator('#currentWeekTable [data-share-client]');
  await expect(receiptButton).toHaveAttribute('data-share-client', clientPayload);
  await expect(receiptButton).not.toHaveAttribute('onerror');
  await receiptButton.click();
  const receipt = page.locator('#receiptEditScrim');
  await expect(receipt).toBeVisible();
  await expect(receipt.locator('.receipt-preview-item')).toContainText(articlePayload);
  await expect(receipt.locator('[data-xss-probe]')).toHaveCount(0);

  await page.locator('#receiptShareMessage').fill(clientPayload);
  await expect(page.locator('#receiptPreviewMessage')).toHaveText(clientPayload);
  await expect(receipt.locator('[data-xss-probe]')).toHaveCount(0);
  await expect(page.locator('[data-xss-probe]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__xssExecuted)).toBe(false);
});

test('sale deletion confirmation renders untrusted client values as inert text', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.locator('#sidebar [data-view="sales"]').click();
  await expandFirstSalesClientGroup(page);

  const group = page.locator('#currentWeekTable .sales-client-group').first();
  const saleItem = group.locator('.sales-group-item[data-sale-id]').first();
  await expect(saleItem).toContainText(articlePayload);
  await expect(saleItem.locator('[data-xss-probe]')).toHaveCount(0);

  // La eliminación en esta vista se habilita manteniendo presionada
  // la cabecera de la tarjeta del cliente (650 ms).
  const header = group.locator('.sales-client-group-header');
  const bounds = await header.boundingBox();
  if (!bounds) throw new Error('No se encontró la cabecera de la venta');
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(750);
  await page.mouse.up();

  const deleteToggle = group.locator('.sales-group-chevron[data-delete-target-ids]');
  await expect(deleteToggle).toBeVisible();
  await deleteToggle.click();

  const dialog = page.locator('#saleGroupDeleteDialog');
  await expect(dialog).toBeVisible();
  const description = dialog.locator('#saleDeleteDescription');
  await expect(description).toContainText(clientPayload);
  await expect(dialog.locator('[data-xss-probe]')).toHaveCount(0);
  await expect(dialog.locator('img')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__xssExecuted)).toBe(false);

  await dialog.locator('.fa-dialog-cancel').click();
  await expect(dialog).toBeHidden();
  await expect(group).toBeVisible();
  await expect(group).toContainText(articlePayload);
  await expect.poll(() => page.evaluate(() => window.__xssExecuted)).toBe(false);
});
