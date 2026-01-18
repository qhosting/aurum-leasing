
# --- ETAPA 1: DEPENDENCIAS ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

# --- ETAPA 2: COMPILACIÓN ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Compilar frontend y backend
RUN npm run build

# --- ETAPA 3: PRODUCCIÓN ---
FROM node:20-alpine AS runner
LABEL maintainer="Aurum Engineering <dev@aurum.mx>"

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Crear usuario de sistema para seguridad (Principio de menor privilegio)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 aurum_user

# Copiar artefactos compilados
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm install --only=production --legacy-peer-deps && \
    npm cache clean --force

# Ajustar permisos
RUN chown -R aurum_user:nodejs /app
USER aurum_user

EXPOSE 3000

# Healthcheck mejorado: Verifica que la API responda
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/stats/visits').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Ejecutar servidor Node
CMD ["node", "server.js"]
