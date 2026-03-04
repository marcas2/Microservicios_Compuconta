const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

// Plantillas de email por tipo de notificación
const templates = {
  welcome: ({ clientName, modules, total }) => ({
    subject: `¡Bienvenido a Compuconta, ${clientName}!`,
    body: [
      `Hola ${clientName},`,
      ``,
      `Tu suscripción ha sido activada exitosamente.`,
      ``,
      `Módulos adquiridos: ${modules.join(', ')}.`,
      `Total pagado: $${total.toLocaleString('es-CO')} COP.`,
      ``,
      `Accede a tu portal en: https://app.compuconta.com`,
      ``,
      `El equipo de Compuconta`,
    ].join('\n'),
  }),
  payment_failed: ({ clientName }) => ({
    subject: 'Compuconta: Pago no procesado',
    body: `Hola ${clientName}, tu pago no pudo ser procesado. Por favor intenta nuevamente en https://app.compuconta.com`,
  }),
};

// POST /api/notifications — Registrar y simular envío de email
app.post('/api/notifications', async (req, res) => {
  const { to, type, payload } = req.body;
  if (!to || !type)
    return res.status(400).json({ success: false, message: 'to y type son requeridos' });

  const template = templates[type];
  if (!template)
    return res.status(400).json({ success: false, message: `Tipo inválido: ${type}. Tipos válidos: ${Object.keys(templates).join(', ')}` });

  const { subject, body } = template(payload || {});

  try {
    const result = await db.query(
      'INSERT INTO notifications (recipient, type, subject, body) VALUES ($1, $2, $3, $4) RETURNING *',
      [to, type, subject, body]
    );
    // En producción aquí iría nodemailer / SendGrid / AWS SES
    console.log(`[Email simulado] → ${to} | Asunto: ${subject}`);
    res.status(201).json({ success: true, message: 'Notificación enviada', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notifications — Historial de notificaciones
app.get('/api/notifications', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM notifications ORDER BY sent_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => res.json({ service: 'Notifications Service', status: 'running', port: 3005 }));

app.listen(3005, () => console.log('✅ Notifications Service → http://localhost:3005'));
