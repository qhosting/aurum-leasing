# Roadmap del Proyecto Aurum Leasing

## 1. Seguridad (Prioridad Alta)
- [x] **Protección de API Keys**: Mover integración de Gemini AI al backend (`/api/ai/analyze`).
- [ ] **Hash de Contraseñas**: Implementar hashing (bcrypt/argon2) para `users.password`. Actualmente se almacenan en texto plano en la base de datos y migraciones.
- [ ] **Saneamiento de Inputs**: Implementar validación de esquemas (Zod/Joi) en todos los endpoints del backend para prevenir inyección SQL y XSS.
- [ ] **Rate Limiting**: Configurar `express-rate-limit` para prevenir abuso de la API.

## 2. Autenticación y Sesiones
- [ ] **JWT / Sesiones Seguras**: Reemplazar el login simple por un sistema robusto basado en JWT (HttpOnly cookies) o sesiones en Redis.
- [ ] **Manejo de Roles**: Implementar middleware de autorización para proteger endpoints según rol (`Super Admin`, `Arrendador`, `Arrendatario`).
- [ ] **Recuperación de Contraseña**: Flujo de "Olvidé mi contraseña" vía email.

## 3. Calidad de Código y Testing
- [ ] **Tests Unitarios**: Configurar Vitest/Jest y escribir pruebas para utilidades y componentes críticos.
- [ ] **Tests de Integración**: Pruebas de API para asegurar que los endpoints responden correctamente a la base de datos.
- [ ] **Linter & Formatter**: Configurar ESLint y Prettier en el pipeline de CI.

## 4. DevOps y Producción
- [ ] **Variables de Entorno**: Crear `.env.example` y definir estrategia de secretos para producción.
- [ ] **Docker Compose**: Refinar `Dockerfile` y `docker-compose.yml` para un despliegue fácil.
- [ ] **CI/CD**: Configurar GitHub Actions para tests y despliegue automático.

## 5. Funcionalidades Futuras
- [ ] **Integración Real con WhatsApp**: Reemplazar mocks con cliente real de Waha/Twilio.
- [ ] **Telemetría en Tiempo Real**: Ingesta de datos de GPS reales en lugar de mocks.
- [ ] **Pasarela de Pagos**: Integrar Stripe/Openpay para cobros automatizados.
