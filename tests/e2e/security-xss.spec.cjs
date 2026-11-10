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

  await page.locator('[data-view="sales"]').first().click();
  const sales = page.locator('#currentWeekTable');
  await expect(sales.locator('.sales-client-group')).toHaveCount(1);
  await expect(sales).toContainText(clientPayload);
  await expect(sales).toContainText(articlePayload);
  await expect(sales).toContainText(categoryPayload);
  await expect(sales).toContainText(pickupPayload);

  await expect(page.locator('[data-xss-probe]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__xssExecuted)).toBe(false);
});
