-- AURUM LEASING: MASTER INITIALIZATION PLAN (MIRROR) --

Este archivo refleja la estructura consolidada en 'migrations/001_init.cjs'.

1. ESTRUCTURA DDL (JavaScript node-pg-migrate):
   - plans: Catálogo de suscripciones.
   - tenants: Entidades multi-arrendadora.
   - users: Credenciales (SuperAdmin, Arrendador, Arrendatario).
   - drivers: Balance financiero y datos de contrato del chofer.
   - vehicles: Inventario de flota.
   - payments: Ledger de transacciones.
   - notifications: Despacho de alertas.

2. SEED DATA CARGADO:
   - Super Admin: root@aurumcapital.mx
   - Staff Demo: pro@aurum.mx (Tenant t1)
   - Chofer Demo: chofer@aurum.mx (Tenant t1)
   - Flota: Toyota Avanza (v1), Nissan Versa (v2).

3. NOTA TÉCNICA:
   La migración se ejecuta automáticamente al iniciar el servidor 
   mediante el runner interno en 'server.ts'.
