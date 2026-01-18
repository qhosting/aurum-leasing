# AURUM LEASING | DOCKERFILE MASTER MIRROR (v5.2)
# Sincronizado con: Despliegue Cloud Nativo en Puerto 80

# --- ETAPA 1: INSTALACIÓN DE DEPENDENCIAS ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar manifiestos de paquetes
COPY package*.json ./
# Instalación limpia incluyendo devDeps para el proceso de construcción
RUN npm install --legacy-peer-deps

# --- ETAPA 2: CONSTRUCCIÓN (BUILD) ---
FROM node:20-alpine AS builder
WORKDIR /app

# Heredar dependencias de la etapa anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ejecutar el script de build unificado definido en package.json
# Genera: dist/index.js, dist/index.html, y server.js (transpilado)
RUN npm run build

# --- ETAPA 3: TIEMPO DE EJECUCIÓN (RUNNER) ---
FROM node:20-alpine AS runner
LABEL vendor="Aurum Software Group"
LABEL system="Aurum Leasing Management"
LABEL version="5.2.0"

WORKDIR /app

# Variables de entorno críticas
ENV NODE_ENV=production
ENV PORT=80

# Configuración de Seguridad: Usuario no-root para ejecución de procesos
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 aurum_runtime_user

# Copia selectiva de artefactos necesarios para ejecución
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package*.json ./
# CRÍTICO: Las migraciones deben estar disponibles para que el servidor las ejecute al iniciar
COPY --from=builder /app/migrations ./migrations

# Re-instalación de solo dependencias de producción para optimizar peso de imagen
RUN npm install --only=production --legacy-peer-deps && \
    npm cache clean --force

# Asignación de permisos al usuario de ejecución
RUN chown -R aurum_runtime_user:nodejs /app
USER aurum_runtime_user

# El sistema escucha en el puerto 80 (Cloud Estándar)
EXPOSE 80

# Healthcheck dinámico: Verifica el latido del sistema mediante el endpoint de estadísticas
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:80/api/stats/visits').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Comando de arranque: Inicia el servidor maestro. 
# El servidor se encarga de: 
# 1. Sincronizar Esquema DB (node-pg-migrate)
# 2. Levantar el API Gateway
# 3. Servir el cliente PWA desde /dist
CMD ["node", "server.js"]
