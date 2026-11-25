const { test, expect } = require('@playwright/test');

async function openAuthenticatedApp(page, { standalone = false } = {}) {
  await page.addInitScript(({ standalone }) => {
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: standalone });
    const originalMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = query => query === '(display-mode: standalone)'
      ? { matches: standalone, media: query, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }
      : originalMatchMedia(query);
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
    window.__speechRecognitionInstances = [];
    window.SpeechRecognition = class {
      constructor() { this.handlers = {}; window.__speechRecognitionInstances.push(this); }
      start() { this.started = true; queueMicrotask(() => this.onstart?.()); }
      stop() { this.stopped = true; queueMicrotask(() => this.onresult?.({ results: [{ 0: { transcript: 'Vestido negro, marca Ossira, talle M, precio treinta y cinco mil pesos.' }, isFinal: true }] })); queueMicrotask(() => this.onend?.()); }
      abort() { this.aborted = true; queueMicrotask(() => this.onend?.()); }
    };
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: data => Boolean(data.files?.length) });
    Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { window.__sharePayload = data; } });
  }, { standalone });
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.4/dist/umd/supabase.js', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
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
  await expect(page.locator('#publisherPhotoPreview img')).toHaveCount(1);
  await expect(page.locator('#publisherMeasurements')).toBeHidden();

  await page.locator('#publisherCategory').selectOption({ label: 'Remeras' });
  await page.locator('#publisherGarmentName').fill('Remera modal');
  await page.locator('#publisherPhoto').setInputFiles({ ...image, name: 'remera.png' });
  await page.locator('#publisherAddGarment').click();
  await expect(page.locator('#publisherQueuedGarments .publisher-queued-item')).toHaveCount(2);
  await expect(page.locator('#publisherQueuedGarments img')).toHaveCount(2);
  await expect(page.locator('#publisherPhotoPreview img')).toHaveCount(2);

  await page.locator('#publisherGenerate').click();
  await expect(page.locator('#publisherPostText')).toHaveValue(/Capri negro[\s\S]*Remera modal/);
  await page.locator('#publisherShare').click();
  await expect.poll(() => page.evaluate(() => window.__sharePayload?.files?.length || 0)).toBe(2);
  await expect(page.locator('#publisherFeedback')).toContainText('Se abrió el menú para compartir texto y fotografía');

  await page.locator('#publisherQueuedGarments .publisher-queued-item').first().getByRole('button', { name: /Quitar Capri negro/ }).click();
  await expect(page.locator('#publisherQueuedGarments .publisher-queued-item')).toHaveCount(1);
  await expect(page.locator('#publisherQueuedGarments img')).toHaveCount(1);
  await expect(page.locator('#publisherPhotoPreview img')).toHaveCount(1);

  await page.locator('#publisherGenerate').click();
  await expect(page.locator('#publisherPostText')).toHaveValue(/Remera modal/);
  await expect(page.locator('#publisherPostText')).not.toHaveValue(/Capri negro/);

  await page.locator('#publisherShare').click();
  await expect.poll(() => page.evaluate(() => window.__sharePayload?.files?.length || 0)).toBe(1);
  await expect(page.locator('#publisherFeedback')).toContainText('Se abrió el menú para compartir texto y fotografía');
});


test('mobile preview opens as an accessible modal and returns focus to the editor', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#publisherCategory').selectOption({ label: 'Vestidos' });
  await page.locator('#publisherGarmentName').fill('Vestido de prueba');
  await page.locator('#publisherBrand').fill('Ossira');
  await page.locator('#publisherWaist').fill('38');
  await page.locator('#publisherLength').fill('105');
  await page.locator('#publisherPhoto').setInputFiles({
    name: 'vestido-preview.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=', 'base64')
  });

  const trigger = page.locator('#publisherOpenPreview');
  await expect(trigger).toBeVisible();
  await expect(page.locator('#viewPublisher .publisher-preview-card')).toBeHidden();
  await trigger.click();

  const modal = page.locator('#publisherPreviewModal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('.publisher-preview-modal-panel')).toHaveAttribute('aria-modal', 'true');
  await expect(modal.locator('#publisherPreviewTitle')).toBeVisible();
  await expect(modal.locator('#publisherPostText')).toHaveValue(/Vestido de prueba[\s\S]*Marca: Ossira[\s\S]*Cintura: 38 cm[\s\S]*Largo: 105 cm/);
  await expect(modal.locator('#publisherPhotoPreview img')).toBeVisible();
  await expect(modal.locator('#publisherPhotoPreview img')).toHaveCSS('object-fit', 'contain');
  await expect(page.locator('#publisherClosePreview')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(page.locator('#viewPublisher .publisher-preview-card')).toBeHidden();
  await expect(page.locator('#viewPublisher')).toBeVisible();
  await expect(trigger).toBeFocused();
});


test('voice bars follow the dictation session and release the microphone when it stops', async ({ page }) => {
  await page.addInitScript(() => {
    const track = {
      readyState: 'live',
      addEventListener() {},
      stop() { this.readyState = 'ended'; window.__voiceTrackStopped = true; }
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [track] }) }
    });
    window.AudioContext = class {
      constructor() { this.state = 'running'; }
      createAnalyser() {
        return {
          fftSize: 256,
          getByteTimeDomainData(samples) { samples.fill(145); },
          disconnect() {}
        };
      }
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      resume() { return Promise.resolve(); }
      close() { this.state = 'closed'; return Promise.resolve(); }
    };
  });
  await openAuthenticatedApp(page);
  await page.locator('#publisherDictationStart').click();
  const visualizer = page.locator('#publisherAudioVisualizer');
  await expect(visualizer).toHaveClass(/is-active/);
  await expect(page.locator('#publisherAudioLevel')).toContainText('Voz detectada');
  await expect(visualizer).toHaveClass(/is-speaking/);
  await page.locator('#publisherDictationStop').click();
  await expect(visualizer).not.toHaveClass(/is-active/);
  expect(await page.evaluate(() => window.__voiceTrackStopped)).toBe(true);
  await expect(page.locator('#publisherDictationStart')).toBeEnabled();
});


test('publisher reuses the New Sale speech recognition flow and keeps transcript editable before interpretation', async ({ page }) => {
  await openAuthenticatedApp(page);
  await expect(page.locator('#publisherDictationStart')).toBeEnabled();
  await expect(page.locator('#publisherDictationStatus')).toContainText('podría procesar el audio externamente');
  await page.locator('#publisherDictationStart').click();
  await expect(page.locator('#publisherDictationStop')).toBeEnabled();
  expect(await page.evaluate(() => {
    const recognition = window.__speechRecognitionInstances[0];
    return recognition.continuous === true && recognition.interimResults === true;
  })).toBe(true);
  await page.evaluate(() => window.__speechRecognitionInstances[0].onend());
  await expect.poll(() => page.evaluate(() => window.__speechRecognitionInstances.length)).toBe(2);
  await page.locator('#publisherDictationStop').click();
  await expect(page.locator('#publisherTranscript')).toHaveValue(/Vestido negro, marca Ossira/);
  await page.locator('#publisherTranscript').fill('Vestido negro, marca Ossira, talle M, precio treinta y cinco mil pesos.');
  await page.locator('#publisherUseTranscript').click();
  await expect(page.locator('#publisherCategory')).toHaveValue('Vestidos');
  await expect(page.locator('#publisherGarmentName')).toHaveValue(/Vestido negro/i);
  await expect(page.locator('#publisherBrand')).toHaveValue('Ossira');
  await expect(page.locator('#publisherSize')).toHaveValue('M');
  await expect(page.locator('#publisherPrice')).toHaveValue('35000');
});

test('publisher does not generate an empty post when no garment is entered', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.locator('#publisherGenerate').click();
  await expect(page.locator('#publisherFeedback')).toContainText('Agregá al menos una prenda');
  await expect(page.locator('#publisherPostText')).toHaveValue('');
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

test('dictation fills the initial category placeholder but preserves a manually selected category', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.locator('#publisherTranscript').fill('Es un capri de gabardina.');
  await page.locator('#publisherUseTranscript').click();
  await expect(page.locator('#publisherCategory')).toHaveValue('Capris');

  await page.locator('#publisherCategory').selectOption({ label: 'Pantalones' });
  await page.locator('#publisherTranscript').fill('Es un capri de gabardina.');
  await page.locator('#publisherUseTranscript').click();
  await expect(page.locator('#publisherCategory')).toHaveValue('Pantalones');
});

test('dictation preserves an explicitly selected Otros category', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.locator('#publisherCategory').selectOption({ index: 10 });
  await expect(page.locator('#publisherCategory')).toHaveValue('Otros');
  await page.locator('#publisherTranscript').fill('Es un capri de gabardina.');
  await page.locator('#publisherUseTranscript').click();
  await expect(page.locator('#publisherCategory')).toHaveValue('Otros');
});

test('dictation normalizes noisy size labels, numeric brand names and apocopated twenty-one', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.locator('#publisherTranscript').fill('Pantalón negro, marca cuarenta y siete street, taye veintiún, cintura cuarenta y uno centímetros.');
  await page.locator('#publisherUseTranscript').click();
  await expect(page.locator('#publisherBrand')).toHaveValue('47 street');
  await expect(page.locator('#publisherSize')).toHaveValue('21');
  await expect(page.locator('#publisherWaist')).toHaveValue('41');
});

test('spoken numeric sizes normalize one-ending and compound Spanish numbers', async ({ page }) => {
  await openAuthenticatedApp(page);
  const transcript = page.locator('#publisherTranscript');
  const interpret = page.locator('#publisherUseTranscript');

  await transcript.fill('Pantalón azul, talle treinta y un, cintura cuarenta y uno centímetros.');
  await interpret.click();
  await expect(page.locator('#publisherSize')).toHaveValue('31');
  await expect(page.locator('#publisherWaist')).toHaveValue('41');

  await transcript.fill('Pantalón negro, talle veintiún, cintura treinta y un centímetros.');
  await interpret.click();
  await expect(page.locator('#publisherSize')).toHaveValue('21');
  await expect(page.locator('#publisherWaist')).toHaveValue('31');

  await transcript.fill('Pantalón gris, talle cuarenta y uno.');
  await interpret.click();
  await expect(page.locator('#publisherSize')).toHaveValue('41');
});

test('publisher interprets category first, reveals the measurement template and then fills every measurement', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.evaluate(() => {
    window.__measurementTemplateWasVisibleOnCategoryChange = false;
    document.querySelector('#publisherCategory').addEventListener('change', () => {
      window.__measurementTemplateWasVisibleOnCategoryChange = !document.querySelector('#publisherMeasurements').hidden;
    });
  });
  await page.locator('#publisherTranscript').fill('Es un capri de gabardina, marca Ossira, talle 40, cintura 42 cm, tiro delantero 17 cm, cadera 49 cm, largo 60 cm y precio siete mil pesos. Botón y cierre funcionando perfectamente.');
  await page.locator('#publisherUseTranscript').click();
  await expect(page.locator('#publisherCategory')).toHaveValue('Capris');
  expect(await page.evaluate(() => window.__measurementTemplateWasVisibleOnCategoryChange)).toBe(true);
  await expect(page.locator('#publisherGarmentName')).toHaveValue(/capri de gabardina/i);
  await expect(page.locator('#publisherBrand')).toHaveValue('Ossira');
  await expect(page.locator('#publisherSize')).toHaveValue('40');
  await expect(page.locator('#publisherPrice')).toHaveValue('7000');
  await expect(page.locator('#publisherWaist')).toHaveValue('42');
  await expect(page.locator('#publisherRise')).toHaveValue('17');
  await expect(page.locator('#publisherHip')).toHaveValue('49');
  await expect(page.locator('#publisherLength')).toHaveValue('60');
  await expect(page.locator('#publisherObservations')).toHaveValue(/Botón y cierre funcionando perfectamente/i);
  await expect(page.locator('#publisherTranscript')).toHaveValue(/Es un capri/i);
});

test('manual publisher works in installed PWA standalone mode without dictation', async ({ page }) => {
  await openAuthenticatedApp(page, { standalone: true });
  await expect.poll(() => page.evaluate(() => navigator.standalone && matchMedia('(display-mode: standalone)').matches)).toBe(true);

  await page.locator('#publisherCategory').selectOption({ label: 'Vestidos' });
  await expect(page.locator('#publisherMeasurements')).toBeVisible();
  await page.locator('#publisherGarmentName').fill('Vestido largo');
  await page.locator('#publisherBrand').fill('Ossira');
  await page.locator('#publisherSize').fill('M');
  await page.locator('#publisherWaist').fill('38');
  await page.locator('#publisherRise').fill('24');
  await page.locator('#publisherHip').fill('48');
  await page.locator('#publisherLength').fill('110');
  await page.locator('#publisherPrice').fill('35000');
  await page.locator('#publisherObservations').fill('Tela liviana y excelente estado');
  await page.locator('#publisherPhoto').setInputFiles({
    name: 'vestido.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=', 'base64')
  });

  await page.locator('#publisherGenerate').click();
  await expect(page.locator('#publisherPostText')).toHaveValue(/Vestido largo[\s\S]*Marca: Ossira[\s\S]*Medidas:[\s\S]*Cintura: 38 cm[\s\S]*Precio: \$35\.000/);
  await page.locator('#publisherShare').click();
  await expect.poll(() => page.evaluate(() => window.__sharePayload?.files?.length || 0)).toBe(1);
});


test('reinterpreting edited transcript replaces generated values and observations', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.locator('#publisherTranscript').fill('Vestido negro, marca Ossira, talle M, precio treinta y cinco mil pesos, cintura 38 cm. Tiene botones completos y tela suave.');
  await page.locator('#publisherUseTranscript').click();
  await expect(page.locator('#publisherCategory')).toHaveValue('Vestidos');
  await expect(page.locator('#publisherGarmentName')).toHaveValue('Vestido negro');
  await expect(page.locator('#publisherPrice')).toHaveValue('35000');
  await expect(page.locator('#publisherObservations')).toHaveValue('Tiene botones completos y tela suave');

  await page.locator('#publisherTranscript').fill('Pantalón azul, marca Kosiuko, talle L, precio cuarenta y dos mil pesos, cintura 44 cm. Presenta una pequeña marca en el bolsillo.');
  await page.locator('#publisherUseTranscript').click();
  await expect(page.locator('#publisherCategory')).toHaveValue('Pantalones');
  await expect(page.locator('#publisherGarmentName')).toHaveValue('Pantalón azul');
  await expect(page.locator('#publisherBrand')).toHaveValue('Kosiuko');
  await expect(page.locator('#publisherSize')).toHaveValue('L');
  await expect(page.locator('#publisherPrice')).toHaveValue('42000');
  await expect(page.locator('#publisherWaist')).toHaveValue('44');
  await expect(page.locator('#publisherObservations')).toHaveValue('Presenta una pequeña marca en el bolsillo');
  await expect(page.locator('#publisherObservations')).not.toContainText('botones completos');

  // Los cambios manuales posteriores tienen prioridad sobre una nueva interpretación.
  await page.locator('#publisherPrice').fill('12345');
  await page.locator('#publisherObservations').fill('Nota agregada manualmente');
  await page.locator('#publisherTranscript').fill('Camisa blanca, marca Zara, talle S, precio dieciocho mil pesos. Detalle dictado nuevo.');
  await page.locator('#publisherUseTranscript').click();
  await expect(page.locator('#publisherCategory')).toHaveValue('Camisas');
  await expect(page.locator('#publisherGarmentName')).toHaveValue('Camisa blanca');
  await expect(page.locator('#publisherBrand')).toHaveValue('Zara');
  await expect(page.locator('#publisherSize')).toHaveValue('S');
  await expect(page.locator('#publisherPrice')).toHaveValue('12345');
  await expect(page.locator('#publisherObservations')).toHaveValue('Nota agregada manualmente');
});

test('measurements are placed with garment fields before the transcription panel', async ({ page }) => {
  await openAuthenticatedApp(page);
  const order = await page.evaluate(() => {
    const measurements = document.querySelector('#publisherMeasurements');
    const transcription = document.querySelector('.publisher-dictation');
    return Boolean(measurements && transcription &&
      (measurements.compareDocumentPosition(transcription) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(order).toBe(true);
  await page.locator('#publisherCategory').selectOption({ label: 'Vestidos' });
  await expect(page.locator('#publisherMeasurements')).toBeVisible();
});


test('editing the transcript during continuous dictation preserves edits and appends the next spoken phrase', async ({ page }) => {
  await openAuthenticatedApp(page);
  await page.locator('#publisherDictationStart').click();
  await page.evaluate(() => {
    const recognition = window.__speechRecognitionInstances[0];
    recognition.onresult({ resultIndex: 0, results: [{ 0: { transcript: 'Vestido negro' }, isFinal: true }] });
  });
  await expect(page.locator('#publisherTranscript')).toHaveValue('Vestido negro');
  await page.locator('#publisherTranscript').fill('Vestido negro, tela de lino');
  await page.evaluate(() => {
    const recognition = window.__speechRecognitionInstances[0];
    recognition.onresult({ resultIndex: 1, results: [
      { 0: { transcript: 'Vestido negro' }, isFinal: true },
      { 0: { transcript: 'marca Ossira' }, isFinal: true }
    ] });
  });
  await expect(page.locator('#publisherTranscript')).toHaveValue('Vestido negro, tela de lino marca Ossira');
  await expect(page.locator('#publisherDictationStop')).toBeEnabled();
});

test('voice visualizer switches red while listening and green while speech is detected', async ({ page }) => {
  await page.addInitScript(() => {
    const track = { readyState: 'live', addEventListener() {}, stop() { this.readyState = 'ended'; } };
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [track] }) } });
    window.AudioContext = class {
      constructor() { this.state = 'running'; }
      createAnalyser() {
        return { fftSize: 256, getByteTimeDomainData(samples) { samples.fill(window.__voiceLevel || 128); }, disconnect() {} };
      }
      createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
      resume() { return Promise.resolve(); }
      close() { this.state = 'closed'; return Promise.resolve(); }
    };
    window.__voiceLevel = 128;
  });
  await openAuthenticatedApp(page);
  await page.locator('#publisherDictationStart').click();
  const visualizer = page.locator('#publisherAudioVisualizer');
  await expect(visualizer).toHaveClass(/is-listening/);
  await page.evaluate(() => { window.__voiceLevel = 170; });
  await expect(visualizer).toHaveClass(/is-speaking/);
  await page.evaluate(() => { window.__voiceLevel = 128; });
  await expect(visualizer).toHaveClass(/is-listening/);
  await page.locator('#publisherDictationStop').click();
});


test('dictation corrects phonetic ASR variants of the word talle before recognized sizes', async ({ page }) => {
  await openAuthenticatedApp(page);
  const transcript = page.locator('#publisherTranscript');
  const interpret = page.locator('#publisherUseTranscript');
  const size = page.locator('#publisherSize');

  for (const [label, expected] of [
    ['ta shelle L', 'L'],
    ['tache M', 'M'],
    ['la shelle XL', 'XL'],
    ['ta shele cuarenta y dos', '42']
  ]) {
    await transcript.fill('Pantalón negro, ' + label + ', cintura 42 cm.');
    await interpret.click();
    await expect(size).toHaveValue(expected);
  }

  // No corregir la misma secuencia si no está introduciendo un talle.
  await transcript.fill('Pantalón negro, la shelle está gastada.');
  await interpret.click();
  await expect(size).toHaveValue('');
});
