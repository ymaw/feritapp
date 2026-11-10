const { test, expect } = require('@playwright/test');

test('initial page load stays within the agreed smoke-test budgets', async ({ page }) => {
  const failedFirstPartyRequests = [];
  page.on('requestfailed', request => {
    if (request.url().startsWith('http://127.0.0.1:4173/')) {
      failedFirstPartyRequests.push({ url: request.url(), error: request.failure()?.errorText });
    }
  });
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());

  const response = await page.goto('/');
  expect(response && response.ok()).toBe(true);
  await expect(page.locator('#authGate')).toBeVisible();

  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource')
      .filter(entry => entry.name.startsWith(location.origin));
    const script = resources.filter(entry => new URL(entry.name).pathname.endsWith('/script.js'));
    const styles = resources.filter(entry => /\.css(?:$|\?)/.test(new URL(entry.name).pathname + new URL(entry.name).search));
    const bytes = entries => entries.reduce((sum, entry) => sum + (entry.encodedBodySize || 0), 0);
    return {
      domContentLoadedMs: navigation ? navigation.domContentLoadedEventEnd : 0,
      loadEventMs: navigation ? navigation.loadEventEnd : 0,
      firstPartyBytes: bytes(resources),
      scriptBytes: bytes(script),
      stylesheetBytes: bytes(styles),
      firstPartyResourceCount: resources.length
    };
  });

  console.log('FERITAPP_PERFORMANCE_SMOKE ' + JSON.stringify(metrics));
  expect(failedFirstPartyRequests).toEqual([]);
  expect(metrics.domContentLoadedMs).toBeGreaterThan(0);
  expect(metrics.domContentLoadedMs).toBeLessThan(10000);
  expect(metrics.firstPartyBytes).toBeLessThan(1500000);
  expect(metrics.scriptBytes).toBeLessThan(350000);
  expect(metrics.stylesheetBytes).toBeLessThan(900000);
});

test('mobile auth layout has no horizontal overflow at common phone widths', async ({ page }) => {
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());

  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    const response = await page.goto('/');
    expect(response && response.ok()).toBe(true);
    await expect(page.locator('#authGate')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
      authGate: Math.ceil(document.querySelector('#authGate').getBoundingClientRect().width)
    }));
    expect(dimensions.document, `document overflow at ${width}px: ${JSON.stringify(dimensions)}`).toBeLessThanOrEqual(width);
    expect(dimensions.authGate).toBeLessThanOrEqual(width);
  }
});
