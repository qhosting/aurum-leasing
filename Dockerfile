# AURUM LEASING | DOCKERFILE MASTER MIRROR (v5.3)
# Despliegue optimizado para la ejecución de migraciones CJS.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 aurum_runtime_user

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/migrations ./migrations

RUN npm install --only=production --legacy-peer-deps
RUN chown -R aurum_runtime_user:nodejs /app
USER aurum_runtime_user

EXPOSE 80

# Al iniciar 'server.js', el sistema sincroniza automáticamente las 
# migraciones presentes en la carpeta /migrations usando el runner 
# node-pg-migrate configurado para ESM.

CMD ["node", "server.js"]
