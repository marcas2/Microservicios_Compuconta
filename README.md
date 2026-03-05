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
cd api-gateway           && npm install
cd clients-service       && npm install
cd modules-service       && npm install
cd payments-service      && npm install
cd onboarding-service    && npm install
cd notifications-service && npm install
```

### Paso 4 — Levantar los servicios (6 terminales separadas)

```cmd
:: Terminal 1
cd api-gateway && node index.js

:: Terminal 2
cd clients-service && node index.js

:: Terminal 3
cd modules-service && node index.js

:: Terminal 4
cd payments-service && node index.js

:: Terminal 5
cd onboarding-service && node index.js

:: Terminal 6
cd notifications-service && node index.js
```

Deberías ver esto en cada terminal:

```
✅ API Gateway           → http://localhost:8080
✅ Clients Service       → http://localhost:3001
✅ Modules Service       → http://localhost:3002
✅ Payments Service      → http://localhost:3003
✅ Onboarding Service    → http://localhost:3004
✅ Notifications Service → http://localhost:3005
```

---

## 🧪 Paso 5 — Probar el flujo de onboarding

### Opción A — Postman (recomendado en Windows)

1. Abre Postman y crea una nueva petición con los siguientes parámetros:
   - **Método:** `POST`
   - **URL:** `http://localhost:8080/api/onboarding/start`
   - **Body** → selecciona `raw` → formato `JSON`

2. Pega el siguiente cuerpo en el Body:

```json
{
  "clientData": {
    "name": "Ferretería El Progreso S.A.S",
    "nit": "901234567-8",
    "email": "contabilidad@elprogreso.com"
  },
  "moduleIds": [1, 2, 5],
  "paymentMethod": "pse"
}
```

3. Haz clic en **Send**. Una respuesta exitosa tendrá `"success": true` y mostrará el detalle de cada paso ejecutado en el campo `steps`.

### Opción B — CMD de Windows

```cmd
curl -X POST http://localhost:8080/api/onboarding/start -H "Content-Type: application/json" -d "{\"clientData\":{\"name\":\"Ferreteria El Progreso S.A.S\",\"nit\":\"901234567-8\",\"email\":\"contabilidad@elprogreso.com\"},\"moduleIds\":[1,2,5],\"paymentMethod\":\"pse\"}"
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

## 🗃️ Paso 6 — Verificar datos en pgAdmin

Después de realizar el POST, abre el Query Tool en pgAdmin y ejecuta:

```sql
SELECT * FROM clients;
SELECT * FROM payments;
SELECT * FROM onboarding_sessions;
SELECT * FROM notifications;
```

Deberías ver los registros creados en tiempo real: el cliente registrado, el pago con estado `approved`, la sesión de onboarding con estado `completed` y la notificación de bienvenida enviada. Esto confirma que la base de datos PostgreSQL está funcionando correctamente con la arquitectura de microservicios.

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
