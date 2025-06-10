// src/controllers/cuentaController.js
import CuentaCorriente from '../models/CuentaCorriente.js';

export const getSaldo = async (req, res) => {
  const { user } = req;
  try {
    const cuenta = await CuentaCorriente.findOne({
      where: { usuarioId: user.id }
    });
    if (!cuenta) {
      return res.status(404).json({ msg: 'Cuenta no encontrada' });
    }
    res.json({
      saldo: cuenta.saldo,
      credito: cuenta.credito
    });
  } catch (err) {
    console.error('Error al obtener saldo:', err);
    res.status(500).json({ msg: 'Error interno' });
  }
};
