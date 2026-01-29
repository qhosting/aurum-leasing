# Roadmap de Pendientes por Implementar

Este documento detalla las funcionalidades y mejoras que aún están pendientes tras la fase inicial de estabilización y seguridad.

## 1. Integraciones Reales (Prioridad Media)
- [ ] **WhatsApp API (Waha/Twilio)**:
    - Actualmente se utilizan mocks en `services/integrationService.ts`.
    - Objetivo: Implementar cliente real para envío de alertas de pago y notificaciones a choferes.
- [ ] **Pasarela de Pagos (Stripe/Openpay)**:
    - Actualmente los pagos se registran manualmente o vía mock.
    - Objetivo: Integrar webhooks para conciliación automática de pagos.
- [ ] **Telemetría GPS (Geotab/Samsara)**:
    - Actualmente se usa simulación de datos en `RiskAIView`.
    - Objetivo: Ingesta de datos en tiempo real para análisis de riesgo preciso.

## 2. Mejoras de Infraestructura (DevOps)
- [ ] **Docker Compose para Desarrollo**:
    - Crear `docker-compose.yml` que levante la app, PostgreSQL y Redis localmente para facilitar el onboarding de nuevos desarrolladores.
- [ ] **Despliegue Automático (CD)**:
    - Configurar pipeline para desplegar a staging/producción tras pasar el CI.

## 3. Funcionalidades de Negocio
- [ ] **Reportes Avanzados**:
    - Exportación a PDF/Excel de estados de cuenta.
- [ ] **Gestión Documental**:
    - Subida de contratos y documentos de identificación a almacenamiento en la nube (AWS S3 / Google Cloud Storage).

## 4. Mantenimiento
- [ ] **Refactorización de Tipos**:
    - Unificar definiciones de tipos entre frontend y backend (actualmente en `types.ts` compartido pero copiados en build).
