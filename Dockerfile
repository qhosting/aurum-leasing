
# --- ETAPA 1: COMPILACIÓN ---
FROM node:20-alpine AS builder

# Dependencias para compilación de módulos nativos
RUN apk add --no-cache python3 make g++ bash

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copiar código y compilar
COPY . .
RUN npm run build

# --- ETAPA 2: PRODUCCIÓN ---
FROM node:20-alpine AS runner
LABEL maintainer="Aurum Engineering <dev@aurum.mx>"

WORKDIR /app

# Copiar solo lo necesario para ejecución
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/package*.json ./

# Instalar dependencias de producción
RUN npm install --production --legacy-peer-deps && npm cache clean --force

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]
