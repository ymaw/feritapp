const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

async function openUnauthenticatedApp(page) {
  await page.addInitScript(() => {
    window.__authMockCalls = [];
    window.supabase = {
      createClient: () => ({
        auth: {
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
          getSession: async () => ({ data: { session: null } }),
          signInWithPassword: async credentials => {
            window.__authMockCalls.push({ method: 'signInWithPassword', email: credentials.email });
            if(window.__authMockReject === 'login') throw new Error('network unavailable');
            return { error: { message: 'mock invalid credentials' } };
          },
          signUp: async credentials => {
            window.__authMockCalls.push({ method: 'signUp', email: credentials.email });
            if(window.__authMockReject === 'signup') throw new Error('network unavailable');
            return { error: null, data: { user: null } };
          },
          resetPasswordForEmail: async email => {
            window.__authMockCalls.push({ method: 'resetPasswordForEmail', email });
            if(window.__authMockReject === 'recovery') throw new Error('network unavailable');
            return { error: null };
          },
          updateUser: async () => ({ error: null, data: { user: null } }),
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
  await expect(page.locator('#gateEmail')).toBeVisible();
  await expect.poll(() => page.evaluate(() => typeof window.supabase)).toBe('object');
}



async function openAppWithPersistedSession(page) {
  await page.addInitScript(() => {
    window.__authMockCalls = [];
    window.__authMockClientCreated = false;
    window.__authMockGetSessionCalls = 0;
    window.__qaPageErrors = [];
    window.addEventListener('error', event => {
      window.__qaPageErrors.push({ type: 'error', message: event.message });
    });
    window.addEventListener('unhandledrejection', event => {
      window.__qaPageErrors.push({ type: 'unhandledrejection', message: String(event.reason) });
    });

    const authMock = {
      onAuthStateChange: callback => {
        window.__authStateChangeHandler = callback;
        return { data: { subscription: { unsubscribe() {} } } };
      },
      getSession: async () => {
        window.__authMockGetSessionCalls += 1;
        if(window.__authMockReject === 'getSession'){
          const result = { data: { session: null }, error: { message: 'mock session read failure' } };
          window.__authMockLastSessionResult = result;
          return result;
        }
        const signedOut = sessionStorage.getItem('qa-signed-out') === '1';
        const result = {
          data: {
            session: signedOut ? null : {
              user: { id: 'qa-session-user', email: 'sesion@example.test' }
            }
          },
          error: null
        };
        window.__authMockLastSessionResult = result;
        return result;
      },
      signInWithPassword: async () => ({ error: { message: 'mock invalid credentials' } }),
      signOut: async options => {
        window.__authMockCalls.push({ method: 'signOut', options: options || null });
        if(window.__authMockReject === 'signout'){
          return { error: { message: 'mock signout failure' } };
        }
        sessionStorage.setItem('qa-signed-out', '1');
        return { error: null };
      },
      from: table => {
        // A restored user already has onboarding completed. Keep the
        // authenticated shell test independent from a live Supabase DB.
        const rows = {
          sales: [],
          categories: [
            { name: 'Remeras' },
            { name: 'Pantalones' },
            { name: 'Vestidos' },
            { name: 'Accesorios' }
          ],
          clients: [],
          user_settings: {
            week_start_day: 1,
            notify_enabled: true,
            notify_days_overdue: 4,
            receipt_message: '¡Gracias por tu compra!',
            store_name: 'Tienda QA',
            avatar_url: ''
          }
        };
        const data = rows[table] ?? [];
        return {
          select: () => ({
            order: async () => ({ data, error: null }),
            maybeSingle: async () => ({ data: table === 'user_settings' ? data : null, error: null })
          }),
          insert: async () => ({ data: [], error: null }),
          upsert: async () => ({ data: [], error: null })
        };
      }
    };

    // Supabase UMD exposes a global named "supabase". Define the same
    // browser-global contract explicitly so the app never depends on CDN
    // script timing or a partially loaded SDK in these isolated tests.
    Object.defineProperty(window, 'supabase', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: {
        createClient: () => {
          window.__authMockClientCreated = true;
          return {
            auth: authMock,
            from: table => authMock.from(table)
          };
        }
      }
    });
  });
  await page.route('https://cdn.jsdelivr.net/**', route =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => window.__authMockClientCreated)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__authMockGetSessionCalls)).toBe(1);
}

test('login rejects invalid email without contacting authentication service', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.locator('#gateEmail').fill('correo-invalido');
  await page.locator('#gatePin').fill('Clave123!');
  await page.locator('#loginBtn').click();
  await expect(page.locator('#gateError')).toContainText('correo electrónico válido');
  await expect(page.locator('#authGate')).toBeVisible();
});

test('signup reveals confirmation and displays every Supabase password requirement', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.locator('#gatePin').fill('Clave123!');
  await page.locator('#signupBtn').click();
  await expect(page.locator('#pinConfirmField')).toBeVisible();
  await expect(page.locator('#reqLength')).toHaveClass(/req-ok/);
  await expect(page.locator('#reqLower')).toHaveClass(/req-ok/);
  await expect(page.locator('#reqUpper')).toHaveClass(/req-ok/);
  await expect(page.locator('#reqNumber')).toHaveClass(/req-ok/);
  await expect(page.locator('#reqSymbol')).toHaveClass(/req-ok/);
});

test('signup enforces eight characters, lowercase, uppercase, number, and symbol', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.locator('#signupBtn').click();

  const invalidPasswords = [
    { value: 'Ab1!xyz', requirement: '#reqLength' },
    { value: 'AB1!XYZW', requirement: '#reqLower' },
    { value: 'ab1!xyzw', requirement: '#reqUpper' },
    { value: 'Abc!xyzw', requirement: '#reqNumber' },
    { value: 'Abc12345', requirement: '#reqSymbol' }
  ];

  for (const invalid of invalidPasswords) {
    await page.locator('#gatePin').fill(invalid.value);
    await page.locator('#gatePinConfirm').fill(invalid.value);
    await expect(page.locator(invalid.requirement)).toHaveClass(/req-bad/);
    await page.locator('#signupBtn').click();
    await expect(page.locator('#gateError')).toContainText('mínimo 8 caracteres');
    await expect.poll(() => page.evaluate(() =>
      window.__authMockCalls.some(call => call.method === 'signUp')
    )).toBe(false);
  }

  await page.locator('#gatePin').fill('Ab1!xyzw');
  await page.locator('#gatePinConfirm').fill('Ab1!xyzw');
  await expect(page.locator('#reqLength')).toHaveClass(/req-ok/);
  await expect(page.locator('#reqLower')).toHaveClass(/req-ok/);
  await expect(page.locator('#reqUpper')).toHaveClass(/req-ok/);
  await expect(page.locator('#reqNumber')).toHaveClass(/req-ok/);
  await expect(page.locator('#reqSymbol')).toHaveClass(/req-ok/);
  await page.locator('#signupBtn').click();
  await expect(page.locator('#gateSentTitle')).toHaveText('¡Cuenta creada!');
  await expect.poll(() => page.evaluate(() =>
    window.__authMockCalls.some(call => call.method === 'signUp')
  )).toBe(true);
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
  await expect.poll(() => page.evaluate(() => window.__authMockCalls.some(call => call.method === 'signUp'))).toBe(true);
  await expect(page.locator('#gateSentTitle')).toHaveText('¡Cuenta creada!');
  await expect(page.locator('#gateSentText')).toContainText('qa@example.test');
});

test('password recovery displays confirmation and returns to login', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.locator('#forgotPinBtn').click();
  await expect(page.locator('#gateStep1')).toBeHidden();
  await expect(page.locator('#gateSent')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__authMockCalls.some(call => call.method === 'resetPasswordForEmail'))).toBe(true);
  await expect(page.locator('#gateSentTitle')).toHaveText('Revisá tu correo');
  await page.locator('#backToEmailBtn').click();
  await expect(page.locator('#gateStep1')).toBeVisible();
  await expect(page.locator('#gateSent')).toBeHidden();
});


test('page bootstrap does not trigger Content Security Policy violations', async ({ page }) => {
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', event => {
      window.__cspViolations.push({
        directive: event.violatedDirective,
        blockedURI: event.blockedURI
      });
    });
  });
  await openUnauthenticatedApp(page);
  const violations = await page.evaluate(() => window.__cspViolations);
  expect(violations).toEqual([]);
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


test('a valid persisted session is restored after a page load', async ({ page }) => {
  await openAppWithPersistedSession(page);

  const bootstrapDiagnostics = await page.evaluate(() => ({
    clientCreated: window.__authMockClientCreated,
    getSessionCalls: window.__authMockGetSessionCalls,
    sessionResult: window.__authMockLastSessionResult,
    appRootDisplay: getComputedStyle(document.getElementById('appRoot')).display,
    appRootInlineDisplay: document.getElementById('appRoot').style.display,
    authGateDisplay: getComputedStyle(document.getElementById('authGate')).display,
    bodyClasses: document.body.className,
    pageErrors: window.__qaPageErrors
  }));
  expect(bootstrapDiagnostics.appRootDisplay, JSON.stringify(bootstrapDiagnostics)).not.toBe('none');
  await expect(page.locator('#appRoot')).toBeVisible();
  await expect(page.locator('#authGate')).toBeHidden();
  await expect(page.locator('#profileEmail')).toHaveText('sesion@example.test');
});

test('a getSession response error keeps the auth gate visible and reports a recoverable message', async ({ page }) => {
  await page.addInitScript(() => { window.__authMockReject = 'getSession'; });
  await openAppWithPersistedSession(page);

  await expect(page.locator('#authGate')).toBeVisible();
  await expect(page.locator('#appRoot')).toBeHidden();
  await expect(page.locator('#gateError')).toContainText('No pudimos comprobar tu sesión');
  await expect(page.locator('#gateError')).not.toContainText('mock session read failure');
});

test('a signOut response error does not reload or claim that logout succeeded', async ({ page }) => {
  await page.addInitScript(() => { window.__authMockReject = 'signout'; });
  await openAppWithPersistedSession(page);

  const dialogs = [];
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });
  await page.evaluate(() => document.getElementById('logoutBtn').click());

  await expect(page.locator('#appRoot')).toBeVisible();
  await expect.poll(() => dialogs.length).toBe(1);
  expect(dialogs[0]).toContain('No se pudo cerrar la sesión');
  const calls = await page.evaluate(() => window.__authMockCalls.filter(call => call.method === 'signOut'));
  expect(calls).toHaveLength(1);
});

test('global signOut response errors are handled without reloading the active session', async ({ page }) => {
  await page.addInitScript(() => { window.__authMockReject = 'signout'; });
  await openAppWithPersistedSession(page);

  const dialogs = [];
  page.on('dialog', async dialog => {
    dialogs.push(dialog.message());
    await dialog.accept();
  });
  await page.evaluate(() => document.getElementById('logoutAllBtn').click());

  await expect(page.locator('#appRoot')).toBeVisible();
  await expect.poll(() => dialogs.length).toBe(2);
  expect(dialogs[0]).toContain('Cerrar la sesión en TODOS los dispositivos');
  expect(dialogs[1]).toContain('No se pudo cerrar la sesión');
  const calls = await page.evaluate(() => window.__authMockCalls.filter(call => call.method === 'signOut'));
  expect(calls[0].options).toEqual({ scope: 'global' });
});

test('an unauthenticated visitor cannot access the application shell', async ({ page }) => {
  await openUnauthenticatedApp(page);

  await expect(page.locator('#authGate')).toBeVisible();
  await expect(page.locator('#appRoot')).toBeHidden();
  await expect(page.locator('#viewDashboard')).toBeHidden();
});

test('30 minutes without activity signs out and returns to the login gate', async ({ page }) => {
  await page.clock.install();
  await openAppWithPersistedSession(page);

  await expect(page.locator('#appRoot')).toBeVisible();
  await page.clock.fastForward(30 * 60 * 1000 + 1);

  await expect(page.locator('#authGate')).toBeVisible();
  await expect(page.locator('#appRoot')).toBeHidden();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('qa-signed-out'))).toBe('1');
});


test('login network exceptions show a recoverable error and re-enable actions', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.evaluate(() => { window.__authMockReject = 'login'; });
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.locator('#gatePin').fill('Clave123!');
  await page.locator('#loginBtn').click();
  await expect(page.locator('#gateError')).toContainText('No se pudo conectar con el servicio');
  await expect(page.locator('#loginBtn')).toBeEnabled();
  await expect(page.locator('#signupBtn')).toBeEnabled();
});

test('signup network exceptions show a recoverable error and re-enable actions', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.locator('#gatePin').fill('Clave123!');
  await page.locator('#signupBtn').click();
  await page.locator('#gatePinConfirm').fill('Clave123!');
  await page.evaluate(() => { window.__authMockReject = 'signup'; });
  await page.locator('#signupBtn').click();
  await expect(page.locator('#gateError')).toContainText('problema de conexión');
  await expect(page.locator('#loginBtn')).toBeEnabled();
  await expect(page.locator('#signupBtn')).toBeEnabled();
});

test('password recovery network exceptions restore the action and keep the form usable', async ({ page }) => {
  await openUnauthenticatedApp(page);
  await page.locator('#gateEmail').fill('qa@example.test');
  await page.evaluate(() => { window.__authMockReject = 'recovery'; });
  await page.locator('#forgotPinBtn').click();
  await expect(page.locator('#gateError')).toContainText('No se pudo conectar para enviar el correo');
  await expect(page.locator('#forgotPinBtn')).toBeEnabled();
  await expect(page.locator('#gateStep1')).toBeVisible();
});


test('a persisted session idle for 30 minutes is rejected after a page reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'feritapp-last-activity:qa-session-user',
      String(Date.now() - (30 * 60 * 1000 + 1))
    );
  });
  await openAppWithPersistedSession(page);
  await expect(page.locator('#authGate')).toBeVisible();
  await expect(page.locator('#appRoot')).toBeHidden();
  await expect.poll(() => page.evaluate(() =>
    window.__authMockCalls.some(call => call.method === 'signOut')
  )).toBe(true);
  await expect(page.locator('#gateError')).toContainText('expiró por inactividad');
});


test('restoring a persisted session preserves the remaining idle deadline', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    localStorage.setItem(
      'feritapp-last-activity:qa-session-user',
      String(Date.now() - (29 * 60 * 1000))
    );
  });
  await openAppWithPersistedSession(page);
  await expect(page.locator('#appRoot')).toBeVisible();
  await page.clock.fastForward(60 * 1000 + 1);
  await expect(page.locator('#authGate')).toBeVisible();
  await expect(page.locator('#appRoot')).toBeHidden();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('qa-signed-out'))).toBe('1');
});


test('returning from the background does not extend the idle deadline without user activity', async ({ page }) => {
  await page.clock.install();
  await page.addInitScript(() => {
    localStorage.setItem(
      'feritapp-last-activity:qa-session-user',
      String(Date.now() - (29 * 60 * 1000))
    );
  });
  await openAppWithPersistedSession(page);
  await expect(page.locator('#appRoot')).toBeVisible();

  await page.evaluate(() => {
    const originalNow = Date.now.bind(Date);
    let visibilityState = 'hidden';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibilityState
    });
    document.dispatchEvent(new Event('visibilitychange'));

    // Simular dos minutos transcurridos en segundo plano sin avanzar los
    // temporizadores de Playwright: solo cambia el reloj de pared observado.
    Date.now = () => originalNow() + (2 * 60 * 1000);
    visibilityState = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
  });

  await expect(page.locator('#authGate')).toBeVisible();
  await expect(page.locator('#appRoot')).toBeHidden();
  await expect.poll(() => page.evaluate(() =>
    sessionStorage.getItem('qa-signed-out')
  )).toBe('1');
});
