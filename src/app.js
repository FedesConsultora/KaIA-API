// src/app.js
import express from 'express';
import rateLimit from 'express-rate-limit';
import swaggerUI from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import router from './routes/router.js';
import methodOverride   from 'method-override';
import adminRouter from './routes/adminRouter.js';
import authRouter from './routes/authRouter.js';
import 'dotenv/config';
import path from 'path';
import 'dotenv/config';
import compression from 'compression';
import { create } from 'express-handlebars';
import session from 'express-session';
import flash   from 'connect-flash';
import cookieParser from 'cookie-parser';
import authDesdeCookie from './middlewares/authDesdeCookie.js';
import hbsHelpers from './helpers/handlebars.js';
import { allowInsecurePrototypeAccess } from '@handlebars/allow-prototype-access';
import webhookRouter from './routes/webhookRouter.js';
import Handlebars from 'handlebars';

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
  max: 100,                 // podés mover esto a process.env.RATE_LIMIT_MAX
  message: 'Demasiadas solicitudes, intentá más tarde.'
});
app.use('/api', apiLimiter);

// handlebars
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

app.use(session({
  secret: 'kaia_secret',
  resave: false,
  saveUninitialized: true
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error   = req.flash('error');
  next();
});
app.set('trust proxy', true);

app.use((req, res, next) => {
  console.log('--- QUERY ---', req.url);
  console.log('--- HEADERS ---', req.headers);
  next();
});

app.use('/webhook/whatsapp', webhookRouter);
// Rutas
app.get('/', (_req, res) => res.redirect('/admin'));
app.use('/api', router);
app.use('/admin', adminRouter);
app.use('/auth', authRouter);


export default app;