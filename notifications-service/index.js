const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

const templates = {
  welcome: ({ clientName, modules, total }) => ({
    subject: `¡Bienvenido a Compuconta, ${clientName}!`,
    body: `Hola ${clientName}, tu suscripción fue activada.\nMódulos: ${modules.join(', ')}.\nTotal: $${total.toLocaleString('es-CO')} COP.\nAccede en: https://app.compuconta.com`,
  }),
};

app.post('/api/notifications', async (req, res) => {
  const { to, type, payload } = req.body;
  if (!to || !type)
    return res.status(400).json({ success: false, message: 'to y type son requeridos' });

  const template = templates[type];
  if (!template)
    return res.status(400).json({ success: false, message: `Tipo inválido: ${type}` });

  const { subject, body } = template(payload || {});

  try {
    const result = await db.query(
      'INSERT INTO notifications (recipient, type, subject, body) VALUES ($1, $2, $3, $4) RETURNING *',
      [to, type, subject, body]
    );
    console.log(`[Email simulado] → ${to} | ${subject}`);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => res.json({ service: 'Notifications Service', status: 'running', port: 3005 }));

app.listen(3005, () => console.log('✅ Notifications Service → http://localhost:3005'));