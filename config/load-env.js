// config/load-env.js  (pequeño helper opcional)
import path from 'path';
import dotenv from 'dotenv';
const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
