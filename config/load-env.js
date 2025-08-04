// config/load-env.js  (pequeño helper opcional)
import path from 'path';
import dotenv from 'dotenv';
const envFile = '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
