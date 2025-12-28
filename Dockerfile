# --- ETAPA 1: COMPILACIÓN ---
FROM node:20-alpine AS builder

# Dependencias para compilación de módulos nativos (pg, node-gyp)
RUN apk add --no-cache python3 make g++ bash

WORKDIR /app

# Instalar dependencias usando legacy-peer-deps para evitar errores de resolución (ERESOLVE)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# Ejecutar el build definido en package.json
# Esto genera el servidor (server.js) y el bundle del cliente (en dist/)
RUN npm run build

# --- ETAPA 2: PRODUCCIÓN ---
FROM node:20-alpine AS runner
LABEL maintainer="Aurum Engineering <dev@aurum.mx>"
LABEL project="Aurum Leasing System"
LABEL version="1.5.1"

WORKDIR /app

# Copiar el servidor compilado y el directorio dist (estáticos del frontend)
# Nota: server.js se genera en la raíz según tsconfig.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción para mantener la imagen ligera
# Es crucial usar --legacy-peer-deps para mantener consistencia con el build
RUN npm install --production --legacy-peer-deps && npm cache clean --force

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# El sistema espera DATABASE_URL y REDIS_URL inyectados por el entorno de cloud
EXPOSE 3000

# Comando de inicio
CMD ["node", "server.js"]
