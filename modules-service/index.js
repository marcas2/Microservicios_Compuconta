const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());

// GET catálogo completo de módulos
app.get('/api/modules', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM modules ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET módulo por ID
app.get('/api/modules/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM modules WHERE id = $1', [req.params.id]);
    if (!result.rows.length)
      return res.status(404).json({ success: false, message: 'Módulo no encontrado' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST cotizar selección de módulos
app.post('/api/modules/quote', async (req, res) => {
  const { moduleIds } = req.body;
  if (!moduleIds || !Array.isArray(moduleIds) || !moduleIds.length)
    return res.status(400).json({ success: false, message: 'moduleIds debe ser un array no vacío' });
  try {
    const result = await db.query(
      'SELECT * FROM modules WHERE id = ANY($1::int[])',
      [moduleIds]
    );
    const total = result.rows.reduce((sum, m) => sum + m.price, 0);
    res.json({ success: true, data: { modules: result.rows, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/health', (req, res) => res.json({ service: 'Modules Service', status: 'running', port: 3002 }));

app.listen(3002, () => console.log('✅ Modules Service → http://localhost:3002'));
