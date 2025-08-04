// src/middlewares/validarCuit.js
import { Usuario } from '../models/index.js';

export default async function validarCuit(req, res, next) {
  const cuit = req.headers['x-cuit'] ?? req.body?.cuit;

  if (!cuit) {
    return res.status(400).json({ msg: 'Debés indicar tu CUIT' });
  }

  const vet = await Usuario.findOne({ where: { cuit, role: 'vet', activo_kronen: true } });

  if (!vet) {
    return res.status(403).json({ msg: 'Cuenta no habilitada para KronenVet' });
  }

  // 👉 guardamos el vete para el resto del flujo
  req.user = vet;               // ¡ojo! aquí es instancia Sequelize
  req.userPlain = vet.get({ plain: true }); // por si querés un objeto plano

  next();
}
