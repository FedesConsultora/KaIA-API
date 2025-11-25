// src/models/index.js
import sequelize from '../../config/database.js';

/* ─── Modelos ─────────────────────────────────── */
import { Usuario } from './Usuario.js';
import { CuentaCorriente } from './CuentaCorriente.js';
import { Producto } from './Producto.js';
import { Promocion } from './Promocion.js';
import { ProductoPromocion } from './ProductoPromocion.js';
import { Compra } from './Compra.js';
import { Feedback } from './Feedback.js';
import { PrecioLog } from './PrecioLog.js';
import { EjecutivoCuenta } from './EjecutivoCuenta.js';
import WhatsAppSession from './WhatsAppSession.js';
import { CondicionComercial } from './CondicionComercial.js';
import { CondicionComercialRegla } from './CondicionComercialRegla.js';
import { UsuarioCondicionComercial } from './UsuarioCondicionComercial.js';

/* ─── Asociaciones ────────────────────────────── */
/** 1 : 1  (Usuario ↔ CuentaCorriente) */
Usuario.hasOne(CuentaCorriente, { foreignKey: 'usuarioId' });
CuentaCorriente.belongsTo(Usuario, { foreignKey: 'usuarioId' });

/** 1 : N  (Usuario ↔ Compra) */
Usuario.hasMany(Compra, { foreignKey: 'usuarioId' });
Compra.belongsTo(Usuario, { foreignKey: 'usuarioId' });

/** 1 : N  (Producto ↔ Compra) */
Producto.hasMany(Compra, { foreignKey: 'productoId' });
Compra.belongsTo(Producto, { foreignKey: 'productoId' });
/** 1 : N  (EjecutivoCuenta ↔ Usuario) */
EjecutivoCuenta.hasMany(Usuario, { foreignKey: 'ejecutivoId' });
Usuario.belongsTo(EjecutivoCuenta, { foreignKey: 'ejecutivoId', as: 'EjecutivoCuenta' });

/** 1 : N  (Promocion ↔ Compra) – promo aplicada en la compra */
Promocion.hasMany(Compra, { foreignKey: 'promo_aplicada' });
Compra.belongsTo(Promocion, { foreignKey: 'promo_aplicada' });

/** 1 : N  (Usuario ↔ Feedback) */
Usuario.hasMany(Feedback, { foreignKey: 'usuarioId' });
Feedback.belongsTo(Usuario, { foreignKey: 'usuarioId' });

/** 1 : N  (Producto ↔ PrecioLog) */
Producto.hasMany(PrecioLog, { foreignKey: 'productoId' });
PrecioLog.belongsTo(Producto, { foreignKey: 'productoId' });

/** 1 : N  (Usuario admin ↔ PrecioLog) */
Usuario.hasMany(PrecioLog, { foreignKey: 'cambiado_por' });
PrecioLog.belongsTo(Usuario, { foreignKey: 'cambiado_por' });


/** M : N  (Producto ↔ Promocion)  */
Producto.belongsToMany(Promocion, {
  through: ProductoPromocion,
  foreignKey: 'productoId',
  otherKey: 'promocionId'
});
Promocion.belongsToMany(Producto, {
  through: ProductoPromocion,
  foreignKey: 'promocionId',
  otherKey: 'productoId'
});

/** 1 : N  (CondicionComercial ↔ CondicionComercialRegla) */
CondicionComercial.hasMany(CondicionComercialRegla, { foreignKey: 'condicionId' });
CondicionComercialRegla.belongsTo(CondicionComercial, { foreignKey: 'condicionId' });

/** 1 : N  (Producto ↔ CondicionComercialRegla) – reglas específicas por producto */
Producto.hasMany(CondicionComercialRegla, { foreignKey: 'productoId' });
CondicionComercialRegla.belongsTo(Producto, { foreignKey: 'productoId' });

/** M : N  (Usuario ↔ CondicionComercial) a través de UsuarioCondicionComercial */
Usuario.belongsToMany(CondicionComercial, {
  through: UsuarioCondicionComercial,
  foreignKey: 'usuarioId',
  otherKey: 'condicionId'
});
CondicionComercial.belongsToMany(Usuario, {
  through: UsuarioCondicionComercial,
  foreignKey: 'condicionId',
  otherKey: 'usuarioId'
});

/* ─── Exportar todos los modelos ──────────────── */
export {
  sequelize,
  Usuario,
  CuentaCorriente,
  Producto,
  Promocion,
  ProductoPromocion,
  Compra,
  Feedback,
  PrecioLog,
  EjecutivoCuenta,
  WhatsAppSession,
  CondicionComercial,
  CondicionComercialRegla,
  UsuarioCondicionComercial
};
