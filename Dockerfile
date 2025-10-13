# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Etapa final
FROM node:20-alpine
WORKDIR /app

# node_modules desde la build
COPY --from=builder /app/node_modules ./node_modules
# código
COPY . .

# Esperar a MySQL
RUN npm i -g wait-port

ENV NODE_ENV=production
EXPOSE 3000

# ← Espera db:3306 y arranca la app
CMD ["sh","-c","wait-port db:3306 && node index.js"]
