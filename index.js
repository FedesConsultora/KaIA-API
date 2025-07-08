// index.js
import 'dotenv/config';
import app from './src/app.js';
import sequelize from './config/database.js';
import './src/models/index.js'; 

const PORT = process.env.PORT || 3000;

async function main() {
  try {
    // 1) Conectar a la DB
    await sequelize.authenticate();
    
    console.log('🟢  Base de datos conectada');

    // 2) (Opcional) Sincronizar modelos
    await sequelize.sync(); 
    console.log('✅  Modelos sincronizados');

    // 3) Levantar servidor
    app.listen(PORT, () => {
      console.log(`🚀  KaIA backend corriendo en puerto ${PORT}`);
    });
  } catch (err) {
    console.error('🔴  Error al iniciar la aplicación:', err);
    process.exit(1);
  }
}

main();
