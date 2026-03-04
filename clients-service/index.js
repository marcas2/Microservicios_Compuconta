const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

// GET todos los clientes
app.get('/api/clients', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM clients ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET cliente por ID
app.get('/api/clients/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST registrar cliente
app.post('/api/clients', async (req, res) => {
  const { name, nit, email } = req.body;
  if (!name || !nit || !email)
    return res.status(400).json({ success: false, message: 'name, nit y email son requeridos' });
  try {
    const result = await db.query(
      'INSERT INTO clients (name, nit, email) VALUES ($1, $2, $3) RETURNING *',
      [name, nit, email]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ success: false, message: 'El NIT o email ya está registrado' });
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => res.json({ service: 'Clients Service', status: 'running', port: 3001 }));

app.listen(3001, () => console.log('✅ Clients Service → http://localhost:3001'));
