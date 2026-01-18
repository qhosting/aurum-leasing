-- AURUM LEASING: MASTER INITIALIZATION PLAN --

Este archivo consolida el esquema estructural y los datos maestros 
necesarios para el arranque en frío del sistema Aurum Leasing V5.

1. ESTRUCTURA (DDL):
   - Tablas Creadas: 
     * plans: Catálogo de suscripciones (Basic, Pro, Enterprise).
     * tenants: Entidades multi-inquilino.
     * users: Acceso Super Admin, Arrendador y Arrendatario.
     * drivers: Perfil financiero del chofer y saldos.
     * vehicles: Control de inventario de flota y telemetría básica.
     * payments: Ledger de transacciones y conciliación.
     * notifications: Despacho de alertas internas y staff.

2. CONFIGURACIÓN DE INTEGRIDAD:
   - Foreign Keys con ON DELETE CASCADE para limpieza de tenants.
   - Tipos de datos JSONB para flexibilidad en telemetría y configuración.
   - Soporte nativo para multi-sucursal via tenant_id.

3. DATOS SEMILLA (SEEDING):
   - Super Admin: root@aurumcapital.mx / x0420EZS*
   - Arrendador Demo: pro@aurum.mx / demo123 (Tenant: t1)
   - Chofer Demo: chofer@aurum.mx / demo123 (Tenant: t1)
   - Flota: Toyota Avanza (ABC-123) y Nissan Versa (XYZ-987).

-- DOCUMENTACIÓN SINCRONIZADA CON MIGRACIÓN CJS --
