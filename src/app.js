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

// Rutas nuevas
import catalogoRouter from './routes/catalogoRouter.js';
import recomendacionRouter from './routes/recomendacionRouter.js';
import { startFeedbackScheduler } from './jobs/feedbackScheduler.js';

const app = express();

/* ---------- Seguridad de proxy ---------- */
/**
 * Si corrés detrás de 1 proxy (Nginx/docker), usá 1.
 * Si NO hay proxy delante, usá false.
 * ¡Nunca 'true' literal!
 */
const PROXY_HOPS = process.env.TRUST_PROXY_HOPS;
if (PROXY_HOPS === 'false') app.set('trust proxy', false);
else app.set('trust proxy', Number(PROXY_HOPS || 1));

/* ---------- Middlewares base ---------- */
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.resolve('public')));

app.use(cookieParser());
app.use(authDesdeCookie);

/* ---------- Rate limiters ---------- */
/**
 * Límite global para /api. Como usamos proxy, avisamos a express-rate-limit.
 * No lo aplicamos sobre el webhook para evitar retries de Meta.
 */
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Demasiadas solicitudes, intentá más tarde.',
  trustProxy: !!app.get('trust proxy'), // <- clave para evitar ERR_ERL_PERMISSIVE_TRUST_PROXY
});
app.use('/api', apiLimiter);

/* ---------- Handlebars (Admin) ---------- */
const hbs = create({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.resolve('src/views/layouts'),
  partialsDir: path.resolve('src/views/partials'),
  helpers: hbsHelpers,
  handlebars: allowInsecurePrototypeAccess(Handlebars),
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
      API REST del asistente conversacional **KaIA** para KronenVet.
      `.trim(),
      contact: { name: 'Equipo KaIA', url: 'https://fedes.ai', email: 'soporte@fedes.ai' },
    },
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
    servers: [{ url: '/api', description: 'Servidor local (desarrollo)' }],
  },
  apis: ['./src/routes/*.js'],
});
// app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

/* ---------- Sesión + flash ---------- */
app.use(session({
  secret: process.env.SESSION_SECRET || 'kaia_secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    sameSite: 'lax',
    secure: !!process.env.SESSION_SECURE, // true si HTTPS
  },
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

/* ---------- Webhook WhatsApp ---------- */
app.use('/webhook/whatsapp', webhookRouter);

/* ---------- Rutas API ---------- */
app.use('/api', router);
app.use('/api/catalogo', catalogoRouter);
app.use('/api/recomendacion', recomendacionRouter);

/* ---------- Admin (navegador) ---------- */
app.get('/', (_req, res) => res.redirect('/admin'));
app.use('/admin', adminRouter);
app.use('/auth', authRouter);

/* ---------- Scheduler de feedback ---------- */
if (String(process.env.FEEDBACK_SCHEDULER_ENABLED || 'true') === 'true') {
  startFeedbackScheduler();
}

/* ---------- 404 / 500 ---------- */
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));
app.use((err, _req, res, _next) => {
  console.error('🚨 Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
