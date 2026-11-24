const { test, expect } = require('@playwright/test');

async function openAuthenticatedApp(page) {
  await page.addInitScript(() => {
    const rows = {
      sales: [],
      categories: [{ id: 'cat-1', name: 'Pantalones' }, { id: 'cat-2', name: 'Remeras' }],
      clients: [],
      notes: [],
      note_labels: [],
      user_settings: {
        week_start_day: 1,
        notify_enabled: false,
        notify_days_overdue: 4,
        receipt_message: 'Gracias',
        store_name: 'Tienda QA',
        avatar_url: '',
        navigation_slots: ['dashboard', 'sales', 'deliveries', 'notes']
      }
    };
    const auth = {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      getSession: async () => ({ data: { session: { user: { id: 'qa-user', email: 'qa@example.test' } } } }),
      signOut: async () => ({ error: null })
    };
    window.supabase = {
      createClient: () => ({
        auth,
        from: table => ({
          select: () => ({
            order: async () => ({ data: Array.isArray(rows[table]) ? rows[table] : [], error: null }),
            maybeSingle: async () => ({ data: table === 'user_settings' ? rows[table] : null, error: null })
          }),
          upsert: async () => ({ data: [], error: null }),
          insert: async () => ({ data: [], error: null })
        })
      })
    };
    window.__sharePayload = null;
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: data => Boolean(data.files?.length) });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.__sharePayload = data; } });
  });
  await page.route('https://cdn.jsdelivr.net/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#appRoot')).toBeVisible();
  await page.locator('#sidebar [data-view="publisher"]').click();
  await expect(page.locator('#viewPublisher')).toBeVisible();
}

test('publisher stages garments with separate photo previews, removes safely and shares all files', async ({ page }) => {
  await openAuthenticatedApp(page);
  const image = {
    name: 'capri.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=', 'base64')
  };

  await page.locator('#publisherCategory').selectOption({ label: 'Pantalones' });
  await page.locator('#publisherGarmentName').fill('Capri negro');
  await page.locator('#publisherBrand').fill('Ossira');
  await page.locator('#publisherWaist').fill('42');
  await page.locator('#publisherPhoto').setInputFiles(image);
  await expect(page.locator('#publisherPhotoPreview img')).toBeVisible();
  await page.locator('#publisherAddGarment').click();

  await expect(page.locator('#publisherQueuedGarments .publisher-queued-item')).toHaveCount(1);
  await expect(page.locator('#publisherQueuedGarments img')).toHaveCount(1);
  await expect(page.locator('#publisherPhotoPreview img')).toHaveCount(0);
  await expect(page.locator('#publisherMeasurements')).toBeHidden();

  await page.locator('#publisherCategory').selectOption({ label: 'Remeras' });
  await page.locator('#publisherGarmentName').fill('Remera modal');
  await page.locator('#publisherPhoto').setInputFiles({ ...image, name: 'remera.png' });
  await page.locator('#publisherAddGarment').click();
  await expect(page.locator('#publisherQueuedGarments .publisher-queued-item')).toHaveCount(2);
  await expect(page.locator('#publisherQueuedGarments img')).toHaveCount(2);

  await page.locator('#publisherQueuedGarments .publisher-queued-item').first().getByRole('button', { name: /Quitar Capri negro/ }).click();
  await expect(page.locator('#publisherQueuedGarments .publisher-queued-item')).toHaveCount(1);
  await expect(page.locator('#publisherQueuedGarments img')).toHaveCount(1);

  await page.locator('#publisherGenerate').click();
  await expect(page.locator('#publisherPostText')).toHaveValue(/Remera modal/);
  await expect(page.locator('#publisherPostText')).not.toHaveValue(/Capri negro/);

  await page.locator('#publisherShare').click();
  await expect.poll(() => page.evaluate(() => window.__sharePayload?.files?.length || 0)).toBe(1);
  await expect(page.locator('#publisherFeedback')).toContainText('Se abrió el menú para compartir texto y fotografía');
});

test('invalid replacement photo clears the visible preview and selected attachment', async ({ page }) => {
  await openAuthenticatedApp(page);
  const validImage = {
    name: 'valid.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=', 'base64')
  };
  await page.locator('#publisherPhoto').setInputFiles(validImage);
  await expect(page.locator('#publisherPhotoPreview img')).toBeVisible();
  await page.locator('#publisherPhoto').setInputFiles({ name: 'invalid.gif', mimeType: 'image/gif', buffer: Buffer.from('GIF89a') });
  await expect(page.locator('#publisherPhotoPreview img')).toHaveCount(0);
  await expect(page.locator('#publisherPhotoPreview')).toContainText('La fotografía seleccionada aparecerá acá');
  await expect(page.locator('#publisherFeedback')).toContainText('Formato no compatible');
  await page.locator('#publisherGarmentName').fill('Prenda sin foto');
  await page.locator('#publisherGenerate').click();
  await page.locator('#publisherShare').click();
  await expect.poll(() => page.evaluate(() => window.__sharePayload?.files?.length || 0)).toBe(0);
});
