const { test, expect } = require('@playwright/test');

async function openAuthWithRecoveryMock(page) {
  await page.addInitScript(() => {
    window.__authStateListener = null;
    window.__authMockCalls = [];
    window.supabase = {
      createClient: () => ({
        auth: {
          onAuthStateChange: callback => {
            window.__authStateListener = callback;
            return { data: { subscription: { unsubscribe() {} } } };
          },
          getSession: async () => ({ data: { session: null } }),
          signInWithPassword: async () => ({ error: { message: 'mock invalid credentials' } }),
          signUp: async () => ({ error: null, data: { user: null } }),
          resetPasswordForEmail: async () => ({ error: null }),
          updateUser: async attributes => {
            window.__authMockCalls.push({ method: 'updateUser', attributes });
            return { error: { message: 'mock update failure' }, data: { user: null } };
          },
          signOut: async () => ({ error: null })
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
  await expect.poll(() => page.evaluate(() => typeof window.__authStateListener)).toBe('function');
}

test('auth form supports keyboard traversal and exposes a visible input focus state', async ({ page }) => {
  await openAuthWithRecoveryMock(page);

  await page.keyboard.press('Tab');
  await expect(page.locator('#gateEmail')).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('#gatePin')).toBeFocused();
  const focusStyle = await page.locator('#gatePin').evaluate(element => {
    const style = getComputedStyle(element);
    return { boxShadow: style.boxShadow, borderColor: style.borderColor };
  });
  expect(focusStyle.boxShadow).not.toBe('none');

  await page.keyboard.press('Tab');
  await expect(page.locator('[data-target="gatePin"]')).toBeFocused();
  await expect(page.locator('[data-target="gatePin"]')).toHaveAttribute('aria-label', 'Mostrar contraseña');

  await page.keyboard.press('Tab');
  await expect(page.locator('#loginBtn')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#signupBtn')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#forgotPinBtn')).toBeFocused();
});

test('password recovery requires a valid matching password and handles update errors accessibly', async ({ page }) => {
  await openAuthWithRecoveryMock(page);

  await page.evaluate(() => window.__authStateListener('PASSWORD_RECOVERY', { user: { email: 'qa@example.test' } }));
  await expect(page.locator('#gateNewPin')).toBeVisible();

  await page.locator('#newPin').fill('Clave123!');
  await page.locator('#newPinConfirm').fill('Distinta123!');
  await page.locator('#newPinSubmit').click();
  await expect(page.locator('#newPinError')).toContainText('no coinciden');
  await expect.poll(() => page.evaluate(() => window.__authMockCalls.length)).toBe(0);

  await page.locator('#newPinConfirm').fill('Clave123!');
  await page.locator('#newPinSubmit').click();
  await expect.poll(() => page.evaluate(() => window.__authMockCalls.length)).toBe(1);
  await expect(page.locator('#newPinError')).toContainText('No se pudo guardar la contraseña');
  await expect(page.locator('#gateNewPin')).toBeVisible();
});
