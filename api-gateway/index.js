const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

const routes = [
  { path: '/api/clients',       target: 'http://localhost:3001' },
  { path: '/api/modules',       target: 'http://localhost:3002' },
  { path: '/api/payments',      target: 'http://localhost:3003' },
  { path: '/api/onboarding',    target: 'http://localhost:3004' },
  { path: '/api/notifications', target: 'http://localhost:3005' },
];

app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.path}`);
  next();
});

routes.forEach(({ path, target }) => {
  app.use(path, createProxyMiddleware({ target, changeOrigin: true }));
});

app.get('/health', (req, res) => res.json({ service: 'API Gateway', status: 'running', port: 8080 }));

app.listen(8080, () => console.log('✅ API Gateway → http://localhost:8080'));