# Dockerfile oficial para Aurum Leasing
# Optimizado para Easypanel, Coolify y Despliegues Cloud
# Dominio: aurumleasing.mx

# --- ETAPA 1: COMPILACIÓN ---
FROM node:20-alpine AS builder

# Instalar dependencias del sistema para módulos nativos (ej. pg, ioredis)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    bash

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para el build)
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Ejecutar el proceso de construcción definido en package.json
# Esto genera /dist (Frontend) y /server.js (Backend compilado)
RUN npm run build

# --- ETAPA 2: PRODUCCIÓN ---
FROM node:20-alpine AS runner

# Definir metadatos
LABEL maintainer="Aurum Software Engineering <dev@aurum.mx>"
LABEL description="Sistema de Gestión de Flotas Aurum Leasing"

WORKDIR /app

# Copiar artefactos desde la etapa de construcción
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción para mantener la imagen ligera y segura
RUN npm install --production && \
    npm cache clean --force

# Configuración de variables de entorno de producción
ENV NODE_ENV=production
ENV PORT=3000

# El servidor de Aurum corre por defecto en el puerto 3000
EXPOSE 3000

# Ejecutar el servidor usando Node.js
# server.js es un módulo ES (ESM) según package.json
CMD ["node", "server.js"]
