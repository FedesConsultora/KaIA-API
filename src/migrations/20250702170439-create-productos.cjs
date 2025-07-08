'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('productos', {
      id:             { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      id_articulo:    { type: S.STRING, unique: true, allowNull: true },
      nombre:         { type: S.STRING, allowNull: false },
      costo:          { type: S.DECIMAL(10,2) },
      precio:         { type: S.DECIMAL(10,2) },
      presentacion:   { type: S.STRING },
      proveedor:      { type: S.STRING },
      marca:          { type: S.STRING },
      rubro:          { type: S.STRING },
      familia:        { type: S.STRING },
      debaja:         { type: S.BOOLEAN, allowNull: false, defaultValue: false },
      cantidad:       { type: S.INTEGER },
      stockMin:       { type: S.INTEGER },
      stockMax:       { type: S.INTEGER },
      codBarras:      { type: S.STRING },
      observaciones:  { type: S.TEXT },
      puntos:         { type: S.INTEGER, allowNull: false, defaultValue: 0 },
      visible:        { type: S.BOOLEAN, allowNull: false, defaultValue: true },
      creado_en:      { type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') }
    });

    await qi.addIndex('productos', ['nombre', 'presentacion', 'marca'], {
      name: 'productos_nombre_presentacion_marca'
    });
  },

  down: async (qi) => {
    await qi.dropTable('productos');
  }
};
