// src/app.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import swaggerUI from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import router from './routes/router.js';
import methodOverride from 'method-override';
import adminRouter from './routes/adminRouter.js';
import authRouter from './routes/authRouter.js';
import 'dotenv/config';
import path from 'path';
import compression from 'compression';
import { create } from 'express-handlebars';
import session from 'express-session';
import flash from 'connect-flash';
import cookieParser from 'cookie-parser';
import authDesdeCookie from './middlewares/authDesdeCookie.js';
import hbsHelpers from './helpers/handlebars.js';
import { allowInsecurePrototypeAccess } from '@handlebars/allow-prototype-access';
import webhookRouter from './routes/webhookRouter.js';
import Handlebars from 'handlebars';

// ⚠️ IMPORTÁ TUS NUEVAS RUTAS AQUÍ
import catalogoRouter from './routes/catalogoRouter.js';
import recomendacionRouter from './routes/recomendacionRouter.js';

const app = express();

/* ---------- middlewares base ---------- */
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.resolve('public')));

app.use(cookieParser());
app.use(authDesdeCookie);

// Rate-limit global
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: Number(process.env.RATE_LIMIT_MAX || 100),
  message: 'Demasiadas solicitudes, intentá más tarde.'
});
app.use('/api', apiLimiter);

// Handlebars (Admin)
const hbs = create({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.resolve('src/views/layouts'),
  partialsDir: path.resolve('src/views/partials'),
  helpers: hbsHelpers,
  handlebars: allowInsecurePrototypeAccess(Handlebars)
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.resolve('src/views'));

/* ─────────── Swagger (opcional) ─────────── */
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KaIA – API para Asistente Inteligente',
      version: '1.0.0',
      description: `
      API REST del asistente conversacional **KaIA**, desarrollado para KronenVet.

      Endpoints principales:
      - Webhook de WhatsApp
      - Recomendación de productos
      - Catálogo (búsqueda/consulta)
      `.trim(),
      contact: {
        name: 'Equipo KaIA',
        url: 'https://fedes.ai',
        email: 'soporte@fedes.ai'
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    },
    servers: [{ url: '/api', description: 'Servidor local (desarrollo)' }]
  },
  apis: ['./src/routes/*.js']
});
// Si querés exponer Swagger UI:
// app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

app.use(session({
  secret: process.env.SESSION_SECRET || 'kaia_secret',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});
app.set('trust proxy', true);

/* ---------- Webhook WhatsApp ---------- */
app.use('/webhook/whatsapp', webhookRouter);

/* ---------- Rutas API ---------- */
app.use('/api', router);                        // /api/health, etc.
app.use('/api/catalogo', catalogoRouter);       // ← NUEVO: catálogo
app.use('/api/recomendacion', recomendacionRouter); // ← NUEVO: recomendar

/* ---------- Admin (navegador) ---------- */
app.get('/', (_req, res) => res.redirect('/admin'));
app.use('/admin', adminRouter);
app.use('/auth', authRouter);

export default app;
