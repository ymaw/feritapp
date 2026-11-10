const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function openUnauthenticatedApp(page) {
  await page.route('https://cdn.jsdelivr.net/**', async route => {
    const url = route.request().url();
    if (url.includes('@supabase/supabase-js')) {
      return route.fulfill({
        contentType: 'application/javascript',
        body: `window.supabase = { createClient: () => ({ auth: {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
          getSession: async () => ({ data: { session: null } }),
          signInWithPassword: async () => ({ error: { message: 'mock invalid credentials' } }),
          signUp: async () => ({ error: null, data: { user: null } }),
          resetPasswordForEmail: async () => ({ error: null }),
          updateUser: async () => ({ error: null, data: { user: null } }),
          signOut: async () => ({ error: null })
        } }) } };`
      });
    }
    return route.fulfill({ contentType: 'application/javascript', body: '' });
  });
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#authGate')).toBeVisible();
  await expect(page.locator('#gateEmail')).toBeVisible();
}

test('login rejects invalid email without contacting authentication service', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.locator('#gateEmail').fill('correo-invalido');
  await page.locator('#gatePin').fill('Clave123!');
  await page.locator('#loginBtn').click();
  await expect(page.locator('#gateError')).toContainText('correo electrónico válido');
  await expect(page.locator('#authGate')).toBeVisible();
});

test('signup reveals confirmation and updates password requirements', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.locator('#gatePin').fill('Clave123!');
  await page.locator('#signupBtn').click();
  await expect(page.locator('#pinConfirmField')).toBeVisible();
  await expect(page.locator('#reqLength')).toHaveClass(/req-ok/);
  await expect(page.locator('#reqUpper')).toHaveClass(/req-ok/);
  await expect(page.locator('#reqNumber')).toHaveClass(/req-ok/);
  await expect(page.locator('#reqSymbol')).toHaveClass(/req-ok/);
});

test('signup rejects a mismatched password confirmation', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.locator('#gatePin').fill('Clave123!');
  await page.locator('#signupBtn').click();
  await page.locator('#gatePinConfirm').fill('Otra123!');
  await page.locator('#signupBtn').click();
  await expect(page.locator('#gateError')).toContainText('no coinciden');
  await expect(page.locator('#authGate')).toBeVisible();
});


test('signup completes the confirmation-email screen with valid input', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.locator('#gatePin').fill('Clave123!');
  await page.locator('#signupBtn').click();
  await page.locator('#gatePinConfirm').fill('Clave123!');
  await page.locator('#signupBtn').click();
  await expect(page.locator('#gateStep1')).toBeHidden();
  await expect(page.locator('#gateSent')).toBeVisible();
  await expect(page.locator('#gateSentTitle')).toHaveText('¡Cuenta creada!');
  await expect(page.locator('#gateSentText')).toContainText('qa@example.test');
});

test('password recovery displays confirmation and returns to login', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.locator('#forgotPinBtn').click();
  await expect(page.locator('#gateStep1')).toBeHidden();
  await expect(page.locator('#gateSent')).toBeVisible();
  await expect(page.locator('#gateSentTitle')).toHaveText('Revisá tu correo');
  await page.locator('#backToEmailBtn').click();
  await expect(page.locator('#gateStep1')).toBeVisible();
  await expect(page.locator('#gateSent')).toBeHidden();
});

test('authentication screen passes automated WCAG 2.1 A/AA checks', async ({ page }) => {
  await openUnauthenticatedApp(page);
  const results = await new AxeBuilder({ page })
    .include('#authGate')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('login remains usable on a narrow mobile viewport and dark theme', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript(() => localStorage.setItem('feritapp-theme', 'dark'));
  await openUnauthenticatedApp(page);
  await expect(page.locator('#loginBtn')).toBeVisible();
  await expect(page.locator('#signupBtn')).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
