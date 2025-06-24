// src/app.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import swaggerUI from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import router from './routes/router.js';
import 'dotenv/config';

const app = express();
app.use(express.json());

// Rate-limit global
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,                 // podés mover esto a process.env.RATE_LIMIT_MAX
  message: 'Demasiadas solicitudes, intentá más tarde.'
});
app.use('/api', apiLimiter);

/* ─────────── Swagger ─────────── */
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KaIA – API para Asistente Inteligente',
      version: '1.0.0',
      description: `
API REST del asistente conversacional **KaIA**, desarrollado para KronenVet.  

Incluye endpoints para:

- Consulta de stock en tiempo real
- Consulta de saldo de cuenta corriente
- Futuras funcionalidades de recomendación inteligente y feedback in-chat

Autenticación mediante JWT.  
Tecnologías: Node.js, Express, Sequelize, MySQL.
      `.trim(),
      contact: {
        name: 'Equipo Encargado de KaIA',
        url: 'https://fedes.ai',
        email: 'soporte@fedes.ai'
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {} // se completan desde los modelos
    },
    servers: [
      {
        url: '/api',
        description: 'Servidor local (desarrollo)'
      }
    ]
  },
  apis: ['./src/routes/*.js']
});

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Rutas
app.use('/api', router);

export default app;