// src/middlewares/validarCuit.js
import { Usuario } from '../models/index.js';

/**
 * Chequea el CUIT en este orden:
 *  - req.session.cuit (si ya lo pedimos antes)
 *  - Header 'x-cuit'
 *  - Body 'cuit'
 *
 * Si valida, persiste en sesión para próximas llamadas.
 */
export default async function validarCuit(req, res, next) {
  try {
    let cuit =
      req.session?.cuit ||
      req.headers['x-cuit'] ||
      req.body?.cuit;

    if (!cuit) {
      return res.status(401).json({
        msg: 'Necesito tu CUIT (11 dígitos) para continuar con la recomendación.'
      });
    }

    cuit = String(cuit).replace(/\D/g, '').slice(0, 11);

    const vet = await Usuario.findOne({
      where: { cuit, role: 'vet', /* opcional: activo_kronen: true */ }
    });

    if (!vet) {
      return res.status(403).json({
        msg: 'CUIT no habilitado. Por favor verificá tus datos con tu ejecutivo.'
      });
    }

    // Guardamos sesión
    req.session.cuit = cuit;
    req.user = vet;
    req.userPlain = vet.get({ plain: true });
    next();
  } catch (err) {
    console.error('validarCuit error:', err);
    res.status(500).json({ msg: 'Error validando CUIT' });
  }
}
