# Roadmap del Proyecto Aurum Leasing

## 1. Seguridad (Prioridad Alta)
- [x] **Protección de API Keys**: Mover integración de Gemini AI al backend (`/api/ai/analyze`).
- [x] **Hash de Contraseñas**: Implementar hashing (bcrypt) para `users.password` en login y seed data.
- [x] **Saneamiento de Inputs**: Implementar validación de esquemas (Zod) en todos los endpoints del backend.
- [x] **Rate Limiting**: Configurar `express-rate-limit` global y específico para login.

## 2. Autenticación y Sesiones
- [x] **JWT / Sesiones Seguras**: Reemplazar el login simple por un sistema robusto basado en JWT (HttpOnly cookies).
- [x] **Manejo de Roles**: Implementar middleware de autorización para proteger endpoints según rol (`Super Admin`, `Arrendador`, `Arrendatario`).
- [x] **Recuperación de Contraseña**: Flujo de "Olvidé mi contraseña" vía email (endpoints backend implementados).

## 3. Calidad de Código y Testing
- [x] **Tests Unitarios**: Configurar Vitest y escribir pruebas para esquemas Zod.
- [x] **Tests de Integración**: Pruebas de API con Supertest y mocks de BD.
- [x] **Linter & Formatter**: Configurar ESLint y Prettier.

## 4. DevOps y Producción
- [x] **Variables de Entorno**: Crear `.env.example` y definir estrategia de secretos para producción.
- [ ] **Docker Compose**: Refinar `Dockerfile` y `docker-compose.yml` para un despliegue fácil.
- [x] **CI/CD**: Configurar GitHub Actions para tests y despliegue automático.

## 5. Funcionalidades Futuras
- [ ] **Integración Real con WhatsApp**: Reemplazar mocks con cliente real de Waha/Twilio.
- [ ] **Telemetría en Tiempo Real**: Ingesta de datos de GPS reales en lugar de mocks.
- [ ] **Pasarela de Pagos**: Integrar Stripe/Openpay para cobros automatizados.
