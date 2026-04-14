# ⚠️ ROADMAP PENDIENTES - AURUM LEASING
## Tareas Críticas, Features Productivas & Deuda Técnica

---

## 🚨 **TAREAS CRÍTICAS (Alta Prioridad)**

### **Seguridad**
- [x] **[ALTA]** Implementar rotación de JWT_SECRET en producción
- [ ] **[ALTA]** Configurar HTTPS/TLS en producción (certificados SSL)
- [ ] **[ALTA]** Implementar 2FA (Two-Factor Authentication) para Super Admins
- [x] **[ALTA]** Auditoría de seguridad de dependencias (`npm audit fix`)
- [x] **[ALTA]** Sanitización de inputs SQL (prevención de SQL injection)
- [ ] **[ALTA]** Implementar CSRF tokens en formularios sensibles
- [x] **[MEDIA]** Logging de intentos de acceso fallidos (sistema de alertas)
- [ ] **[MEDIA]** Configurar backup automático de base de datos PostgreSQL

### **Bugs Conocidos**
- [ ] **[ALTA]** RiskAIView usa `MOCK_VEHICLES` en lugar de datos reales de API
- [ ] **[ALTA]** Verificar que todas las migraciones se ejecuten correctamente en producción
- [ ] **[MEDIA]** Validar que el sistema de uploads (`multer`) maneje correctamente archivos grandes
- [ ] **[MEDIA]** Testear comportamiento del rate limiting en entornos con múltiples instancias
- [x] **[ALTA]** Verificar aislamiento de datos entre tenants (multi-tenancy security)

### **Performance**
- [x] **[ALTA]** Implementar índices de base de datos para queries frecuentes
- [x] **[ALTA]** Configurar compresión gzip/brotli en Nginx/producción
- [x] **[MEDIA]** Implementar lazy loading en componentes React grandes
- [x] **[MEDIA]** Optimizar queries SQL (evitar N+1 queries)
- [x] **[BAJA]** Implementar caché Redis para queries repetitivas

---

## 🚀 **FEATURES NECESARIAS PARA PRODUCCIÓN**

### **Integraciones Reales**
- [ ] **[POSTERGADO]** Conectar pasarela de pago real (Stripe, MercadoPago, PayPal) <!-- Postergado por instrucción del usuario -->
- [ ] **[ALTA]** Integrar WhatsApp Business API oficial (reemplazar WAHA mock)
- [ ] **[ALTA]** Implementar servicio de email transaccional (SendGrid, AWS SES)
- [ ] **[MEDIA]** Integrar sistema de almacenamiento cloud (AWS S3, Google Cloud Storage)
- [ ] **[MEDIA]** Conectar con API de verificación de identidad (KYC)
- [ ] **[BAJA]** Integración con servicios de geolocalización para tracking de flota

### **Gestión de Suscripciones**
- [x] **[ALTA]** Implementar lógica de expiración de planes
- [x] **[ALTA]** Sistema de facturación automática (invoicing)
- [x] **[MEDIA]** Panel de upgrade/downgrade de planes
- [x] **[MEDIA]** Notificaciones de renovación de suscripción
- [ ] **[MEDIA]** Sistema de cupones y descuentos

### **Dashboard & Reportes**
- [ ] **[ALTA]** Dashboard en tiempo real con WebSockets (métricas live)
- [x] **[MEDIA]** Exportación de reportes financieros (CSV, Excel)
- [x] **[MEDIA]** Gráficos de uso de flota por período
- [x] **[MEDIA]** Reportes predictivos con IA (tendencias de pagos, riesgo)
- [ ] **[BAJA]** Sistema de alertas configurables (email/WhatsApp)

### **Gestión de Conductores**
- [x] **[ALTA]** Verificación de licencias de conducir (OCR + validación con Gemini AI)
- [ ] **[MEDIA]** Historial de infracciones y sanciones
- [ ] **[MEDIA]** Sistema de evaluación de desempeño de conductores
- [ ] **[BAJA]** Capacitaciones y certificaciones online

### **Gestión de Flota Avanzada**
- [ ] **[ALTA]** Tracking GPS en tiempo real
- [x] **[ALTA]** Sistema de mantenimiento preventivo (alertas por km/tiempo)
- [ ] **[MEDIA]** Gestión de combustible y gastos operativos
- [x] **[MEDIA]** Historial completo de cada vehículo (mantenimiento, accidentes)
- [ ] **[BAJA]** Integración con talleres mecánicos

### **Experiencia de Usuario**
- [ ] **[ALTA]** Versión móvil responsive (mobile-first design)
- [ ] **[MEDIA]** App móvil nativa (React Native o Flutter)
- [ ] **[MEDIA]** Modo oscuro (dark mode)
- [ ] **[MEDIA]** Soporte multi-idioma (i18n - español, inglés, portugués)
- [ ] **[BAJA]** Sistema de onboarding interactivo

### **Notificaciones Push**
- [ ] **[ALTA]** Implementar FCM (Firebase Cloud Messaging)
- [ ] **[MEDIA]** Notificaciones de pago vencido
- [x] **[MEDIA]** Alertas de mantenimiento de vehículos
- [ ] **[BAJA]** Recordatorios de renovación de documentos

---

## 🛠️ **DEUDA TÉCNICA**

### **Arquitectura & Código**
- [ ] **[ALTA]** Migrar de monolito a microservicios (backend modular)
- [ ] **[ALTA]** Implementar GraphQL API (alternativa a REST)
- [ ] **[MEDIA]** Unificar completamente tipos entre frontend y backend (`shared/types.ts`)
- [ ] **[MEDIA]** Implementar patrón Repository para acceso a datos (desacoplar SQL)
- [ ] **[MEDIA]** Refactorizar `App.tsx` (demasiado grande - 18KB)
- [ ] **[MEDIA]** Crear sistema de feature flags para releases graduales
- [ ] **[BAJA]** Implementar Server-Side Rendering (SSR) con Next.js

### **Testing**
- [ ] **[ALTA]** Aumentar cobertura de tests a >80% (actual: desconocida)
- [ ] **[ALTA]** Implementar tests E2E con Playwright o Cypress
- [ ] **[MEDIA]** Tests de carga y stress con Artillery o k6
- [ ] **[MEDIA]** Tests de seguridad automatizados (OWASP ZAP)
- [ ] **[BAJA]** Tests de accesibilidad (WCAG compliance)

### **DevOps & CI/CD**
- [ ] **[ALTA]** Configurar pipeline completo de CI/CD (build, test, deploy)
- [ ] **[ALTA]** Implementar monitoreo y observabilidad (Prometheus, Grafana)
- [ ] **[ALTA]** Configurar logs centralizados (ELK Stack, Datadog)
- [ ] **[MEDIA]** Implementar blue-green deployment o canary releases
- [ ] **[MEDIA]** Configurar auto-scaling en producción (Kubernetes)
- [ ] **[MEDIA]** Dockerizar ambiente de desarrollo completo
- [ ] **[BAJA]** Implementar disaster recovery plan

### **Documentación**
- [ ] **[ALTA]** Documentar API completa (OpenAPI/Swagger)
- [ ] **[ALTA]** Crear guía de despliegue a producción (runbook)
- [ ] **[MEDIA]** Documentar arquitectura de sistema (diagramas C4)
- [ ] **[MEDIA]** Guía de contribución para desarrolladores
- [ ] **[MEDIA]** Documentación de endpoints internos
- [ ] **[BAJA]** Video tutoriales de uso del sistema

### **Base de Datos**
- [ ] **[ALTA]** Implementar migrations rollback strategy
- [ ] **[MEDIA]** Configurar réplicas de lectura (read replicas)
- [ ] **[MEDIA]** Implementar soft deletes en lugar de eliminaciones físicas
- [ ] **[MEDIA]** Crear vistas materializadas para reportes complejos
- [ ] **[BAJA]** Evaluar migración a TimescaleDB para datos temporales

### **Optimización Frontend**
- [ ] **[ALTA]** Implementar code splitting por ruta
- [ ] **[MEDIA]** Optimizar bundle size (tree shaking, lazy loading)
- [ ] **[MEDIA]** Implementar Service Worker real para PWA offline
- [ ] **[MEDIA]** Caché de assets estáticos (CDN)
- [ ] **[BAJA]** Migrar a Tailwind CSS v4 (cuando esté disponible)

### **Infraestructura**
- [ ] **[ALTA]** Configurar WAF (Web Application Firewall)
- [ ] **[ALTA]** Implementar CDN para assets estáticos
- [ ] **[MEDIA]** Configurar DNS con failover
- [ ] **[MEDIA]** Implementar message queue (RabbitMQ, SQS) para tareas async
- [ ] **[BAJA]** Evaluar serverless para funciones específicas (AWS Lambda)

---

## 📋 **MEJORAS DE CALIDAD DE CÓDIGO**

- [ ] **[MEDIA]** Configurar SonarQube para análisis de código
- [ ] **[MEDIA]** Implement commitlint para conventional commits
- [ ] **[MEDIA]** Configurar Husky pre-commit hooks (lint, test)
- [ ] **[MEDIA]** Añadir badges de CI/CD al README
- [ ] **[BAJA]** Implementar semantic versioning automático

---

## 🔐 **COMPLIANCE & LEGAL**

- [ ] **[ALTA]** Implementar sistema de consentimiento GDPR/LGPD
- [ ] **[ALTA]** Política de privacidad y términos de servicio
- [ ] **[MEDIA]** Sistema de portabilidad de datos (exportación de datos de usuario)
- [ ] **[MEDIA]** Derecho al olvido (eliminación de cuenta completa)
- [ ] **[BAJA]** Certificación ISO 27001

---

## 📊 **ANÁLISIS & MÉTRICAS**

- [ ] **[ALTA]** Implementar Google Analytics o Mixpanel
- [ ] **[MEDIA]** Dashboard de métricas de negocio (KPIs)
- [ ] **[MEDIA]** Tracking de eventos de usuario (Segment, Amplitude)
- [ ] **[BAJA]** Heatmaps y session recordings (Hotjar, FullStory)

---

**Prioridades Sugeridas para Sprint 1 (próximas 2 semanas):**
1. Auditoría de seguridad completa (npm audit, OWASP)
2. ~~Implementar pasarela de pago real~~ (Postergado)
3. Aumentar cobertura de tests a 60%
4. Configurar CI/CD pipeline básico
5. Documentar API con Swagger

**Tareas Recientes Completadas:**
- ✅ Integración de Logo Oficial en todo el sistema.
- ✅ Actualización de branding a "Aurum Leasing".
- ✅ Generación de Sales Deck y PDF de ventas profesional.
- ✅ Configuración de iconos PWA con identidad corporativa real.

**Total de Tareas Pendientes**: ~115  
**Estimación de Tiempo para MVP Productivo**: 2-3 meses
**Última Actualización**: 2026-04-14
