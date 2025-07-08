# Etapa de build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

# Etapa final
FROM node:20-alpine
WORKDIR /app

# Copiamos node_modules desde la build
COPY --from=builder /app/node_modules ./node_modules
# Copiamos el resto del código
COPY . .

# Herramienta para esperar la DB
RUN npm install -g wait-port

# Exponemos puerto
EXPOSE 3000

