const express = require('express');
const fetch   = require('node-fetch');
const path    = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const db = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const SVC = {
  clients:       'http://localhost:3001',
  modules:       'http://localhost:3002',
  payments:      'http://localhost:3003',
  notifications: 'http://localhost:3005',
};

async function call(url, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(url, opts);
  const json = await res.json();
  return { ok: res.ok, data: json };
}

async function updateSession(id, status, steps, clientId = null) {
  await db.query(
    `UPDATE onboarding_sessions
     SET status = $1, steps = $2, client_id = $3, updated_at = NOW()
     WHERE id = $4`,
    [status, JSON.stringify(steps), clientId, id]
  );
}

// POST iniciar onboarding completo
app.post('/api/onboarding/start', async (req, res) => {
  const { clientData, moduleIds, paymentMethod } = req.body;

  if (!clientData || !moduleIds || !paymentMethod)
    return res.status(400).json({ success: false, message: 'clientData, moduleIds y paymentMethod son requeridos' });

  // Crear sesión en BD
  const sessionRes = await db.query(
    `INSERT INTO onboarding_sessions (status, steps) VALUES ('in_progress', '[]') RETURNING *`
  );
  const session = sessionRes.rows[0];
  const steps   = [];

  const addStep = (step, status, detail) => {
    steps.push({ step, status, detail, at: new Date().toISOString() });
  };

  try {
    // PASO 1 — Registrar cliente
    const clientRes = await call(`${SVC.clients}/api/clients`, 'POST', clientData);
    if (!clientRes.ok) {
      addStep('register_client', 'failed', clientRes.data.message);
      await updateSession(session.id, 'failed', steps);
      return res.status(400).json({ success: false, sessionId: session.id, steps, message: clientRes.data.message });
    }
    const client = clientRes.data.data;
    addStep('register_client', 'completed', `Cliente ID ${client.id} creado`);

    // PASO 2 — Cotizar módulos
    const quoteRes = await call(`${SVC.modules}/api/modules/quote`, 'POST', { moduleIds });
    if (!quoteRes.ok) {
      addStep('quote_modules', 'failed', quoteRes.data.message);
      await updateSession(session.id, 'failed', steps, client.id);
      return res.status(400).json({ success: false, sessionId: session.id, steps, message: quoteRes.data.message });
    }
    const { modules, total } = quoteRes.data.data;
    addStep('quote_modules', 'completed', `${modules.length} módulos | Total $${total.toLocaleString('es-CO')}`);

    // PASO 3 — Procesar pago
    const payRes = await call(`${SVC.payments}/api/payments`, 'POST', {
      clientId: client.id, onboardingId: session.id, amount: total, method: paymentMethod,
    });
    if (!payRes.ok) {
      addStep('process_payment', 'failed', 'Pago rechazado — el cliente puede reintentar');
      await updateSession(session.id, 'payment_failed', steps, client.id);
      return res.status(402).json({ success: false, sessionId: session.id, steps, message: 'Pago rechazado. Intente con otro método de pago.' });
    }
    const payment = payRes.data.data;
    addStep('process_payment', 'completed', `Transacción ${payment.transaction_id} aprobada`);

    // PASO 4 — Notificar (fallo aquí no detiene el proceso)
    try {
      await call(`${SVC.notifications}/api/notifications`, 'POST', {
        to: client.email, type: 'welcome',
        payload: { clientName: client.name, modules: modules.map(m => m.name), total },
      });
      addStep('send_notification', 'completed', `Email enviado a ${client.email}`);
    } catch {
      addStep('send_notification', 'skipped', 'Servicio de notificaciones no disponible');
    }

    await updateSession(session.id, 'completed', steps, client.id);

    return res.status(201).json({
      success: true,
      message: '¡Onboarding completado! El cliente puede acceder a sus módulos.',
      sessionId: session.id,
      steps,
      client,
      modules,
      payment,
    });

  } catch (err) {
    addStep('internal_error', 'failed', err.message);
    await updateSession(session.id, 'error', steps);
    return res.status(500).json({ success: false, sessionId: session.id, steps, message: 'Error interno' });
  }
});

// GET sesión por ID
app.get('/api/onboarding/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM onboarding_sessions WHERE id = $1', [req.params.id]);
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Sesión no encontrada' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => res.json({ service: 'Onboarding Service', status: 'running', port: 3004 }));

app.listen(3004, () => console.log('✅ Onboarding Service → http://localhost:3004'));