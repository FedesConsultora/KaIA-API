'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('promociones', {
      id:               { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      nombre:           { type: S.STRING, allowNull: false },
      tipo:             { type: S.STRING },
      detalle:          { type: S.TEXT },
      regalo:           { type: S.STRING },
      presentacion:     { type: S.STRING },
      especie:          { type: S.STRING },
      laboratorio:      { type: S.STRING },
      productos_txt:    { type: S.TEXT },
      stock_disponible: { type: S.INTEGER, defaultValue: 0 },
      inicio:           { type: S.DATE },
      fin:              { type: S.DATE },
      vigente:          { type: S.BOOLEAN, allowNull: false, defaultValue: true },
      creado_en:        { type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') }
    });
  },

  down: async (qi) => {
    await qi.dropTable('promociones');
  }
};
