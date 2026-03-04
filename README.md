# Compuconta — Arquitectura de Microservicios
## Sistema de Onboarding y Gestión de Suscripciones Modulares

---

## Servicios

| Servicio              | Puerto | Responsabilidad                                    |
|-----------------------|--------|----------------------------------------------------|
| API Gateway           | 8080   | Punto único de entrada. Enruta todas las peticiones|
| Clients Service       | 3001   | Registro y consulta de clientes                    |
| Modules Service       | 3002   | Catálogo de módulos y cotizaciones                 |
| Payments Service      | 3003   | Procesamiento de pagos de suscripción              |
| Onboarding Service    | 3004   | Orquesta el flujo completo de registro             |
| Notifications Service | 3005   | Envío de emails transaccionales (simulado)         |

---

## ▶️ Cómo ejecutar

### Paso 1 — Crear la base de datos

Abre pgAdmin, conecta a tu servidor local y ejecuta el archivo `db/init.sql` en el Query Tool.

### Paso 2 — Configurar variables de entorno

Edita el archivo `.env` en la raíz del proyecto con tu contraseña de PostgreSQL:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=compuconta_db
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
```

### Paso 3 — Instalar dependencias (una sola vez)

Abre una terminal en la raíz del proyecto y ejecuta:

```cmd
cd api-gateway           && npm install && cd ..
cd clients-service       && npm install && cd ..
cd modules-service       && npm install && cd ..
cd payments-service      && npm install && cd ..
cd onboarding-service    && npm install && cd ..
cd notifications-service && npm install && cd ..
```

### Paso 4 — Levantar los servicios (6 terminales separadas)

```cmd
cd api-gateway           && node index.js
cd clients-service       && node index.js
cd modules-service       && node index.js
cd payments-service      && node index.js
cd onboarding-service    && node index.js
cd notifications-service && node index.js
```

---

## 🧪 Ejemplos de uso

### Flujo completo de onboarding (request principal)

```bash
curl -X POST http://localhost:8080/api/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{
    "clientData": {
      "name": "Ferreteria El Progreso S.A.S",
      "nit": "901234567-8",
      "email": "contabilidad@elprogreso.com"
    },
    "moduleIds": [1, 2, 5],
    "paymentMethod": "pse"
  }'
```

### Otros endpoints útiles

```bash
# Ver catálogo de módulos
curl http://localhost:8080/api/modules

# Cotizar módulos sin registrar cliente
curl -X POST http://localhost:8080/api/modules/quote \
  -H "Content-Type: application/json" \
  -d '{"moduleIds": [1, 2, 3]}'

# Ver todos los clientes registrados
curl http://localhost:8080/api/clients

# Ver estado de una sesión de onboarding
curl http://localhost:8080/api/onboarding/1

# Verificar salud de todos los servicios
curl http://localhost:8080/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
```

---

## 🗃️ Verificar datos en pgAdmin

Después de ejecutar el onboarding, abre el Query Tool en pgAdmin y ejecuta:

```sql
SELECT * FROM clients;
SELECT * FROM payments;
SELECT * FROM onboarding_sessions;
SELECT * FROM notifications;
```

---

## 📐 Arquitectura

```
        Cliente (Postman / Browser)
                  │
                  ▼
      ┌───────────────────────┐
      │     API GATEWAY       │  :8080
      └──┬────┬────┬────┬─────┘
         │    │    │    │
  ┌──────▼┐ ┌─▼────┴┐ ┌▼──────────┐ ┌──────────────┐
  │clients│ │modules│ │ payments  │ │  onboarding  │
  │service│ │service│ │ service   │ │   service    │
  │ :3001 │ │ :3002 │ │  :3003    │ │    :3004     │
  └───────┘ └───────┘ └───────────┘ └──────┬───────┘
                                           │
                                  ┌────────▼────────┐
                                  │ notifications   │
                                  │    service      │
                                  │     :3005       │
                                  └─────────────────┘
```
