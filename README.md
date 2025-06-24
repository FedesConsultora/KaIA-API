# 🐾 KaIA – Backend (Node.js + Express + Sequelize)

> **KaIA** es un asistente conversacional para veterinarios que trabaja con el catálogo de KrönenVet.  
> Este repo contiene la **API REST** (vía Express) y los servicios que la IA utiliza para consultar stock, sugerir productos, verificar promociones y mostrar el saldo de cada cliente.

---

## ✨ Funcionalidades principales

| Módulo | Ruta base | Descripción |
|--------|-----------|-------------|
| **Auth** | `/auth` | Login por teléfono → JWT |
| **Catálogo** | `/catalogo` | Búsqueda inteligente de productos (`/buscar?term=`) + detalle por ID |
| **Promociones** | `/productos/:id/promos` | Lista las promos activas para un producto |
| **Recomendación** | `/recomendacion` | Sugiere productos según consulta + historial |
| **Cuenta** | `/cuenta/saldo` | Devuelve saldo y crédito del vet (JWT) |
| **Chat (GPT)** | `/chat` | Endpoint de prueba para enviar textos a OpenAI |
| **Swagger UI** | `/api-docs` | Documentación interactiva de la API |
| **Health-check** | `/health` | Responde `status: ok 🔋` |

---

## 📂 Estructura de carpetas

kaia-backend/
├─ config/ # conexión a MySQL
├─ src/
│ ├─ controllers/ # lógica de cada endpoint
│ ├─ routes/ # routers Express
│ ├─ models/ # Sequelize models
│ ├─ middlewares/ # auth, rate-limit…
│ ├─ services/ # GPT, helpers…
│ └─ utils/
├─ .env.example
└─ README.md

---

## ⚙️ Requisitos

* **Node.js 18+**
* **MySQL 8** (o compatible)
* Cuenta en **OpenAI** (para usar GPT)
* (Próximo) **WhatsApp Business API** para conectar el bot

---

## 🚀 Instalación rápida

```bash
git clone https://github.com/<tu-org>/kaia-backend.git
cd kaia-backend
cp .env.example .env      # completar credenciales DB y OPENAI_API_KEY
npm install
npm run dev               # nodemon index.js
# abrir http://localhost:3000/api-docs para ver Swagger
