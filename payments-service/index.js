const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

const VALID_METHODS = ['credit_card', 'debit_card', 'pse', 'nequi'];

// GET pagos de un cliente
app.get('/api/payments/client/:clientId', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM payments WHERE client_id = $1 ORDER BY processed_at DESC',
      [req.params.clientId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST procesar pago
app.post('/api/payments', async (req, res) => {
  const { clientId, onboardingId, amount, method } = req.body;

  if (!clientId || !amount || !method)
    return res.status(400).json({ success: false, message: 'clientId, amount y method son requeridos' });
  if (!VALID_METHODS.includes(method))
    return res.status(400).json({ success: false, message: `Métodos válidos: ${VALID_METHODS.join(', ')}` });

  // Simulación: 85% aprobación
  const approved      = Math.random() > 0.15;
  const status        = approved ? 'approved' : 'rejected';
  const transactionId = `CC-TXN-${Date.now()}`;

  try {
    const result = await db.query(
      `INSERT INTO payments (client_id, onboarding_id, amount, method, status, transaction_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [clientId, onboardingId || null, amount, method, status, transactionId]
    );
    const payment = result.rows[0];
    res.status(approved ? 201 : 402).json({
      success: approved,
      message: approved ? 'Pago aprobado' : 'Pago rechazado por la entidad financiera',
      data: payment,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => res.json({ service: 'Payments Service', status: 'running', port: 3003 }));

app.listen(3003, () => console.log('✅ Payments Service → http://localhost:3003'));