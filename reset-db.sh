#!/bin/bash
set -e

echo "🚀 Reseteando base de datos con Docker + Sequelize..."

# Contenedor y servicio de la app
SERVICE_NAME="app"

echo "🔹 Deshaciendo todas las migraciones..."
docker compose exec $SERVICE_NAME npx sequelize-cli db:migrate:undo:all || true

echo "🔹 Borrando base de datos..."
docker compose exec $SERVICE_NAME npx sequelize-cli db:drop || true

echo "🔹 Creando base de datos..."
docker compose exec $SERVICE_NAME npx sequelize-cli db:create

echo "🔹 Ejecutando migraciones..."
docker compose exec $SERVICE_NAME npx sequelize-cli db:migrate

echo "🔹 Cargando seeders..."
docker compose exec $SERVICE_NAME npx sequelize-cli db:seed:all

echo "✅ Reset completo. Base limpia, migraciones y seeds aplicados."
