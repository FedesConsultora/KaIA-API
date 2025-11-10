# Dump técnico de Base de Datos

> Generado desde `src` — 10/11/2025, 12:16:59


---

### src/migrations/20250702164233-create-usuarios.cjs (47 líneas)

```js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('usuarios', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      cuit: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'vet'
      },
      creado_en: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('usuarios');
  }
};

```

---

### src/migrations/20250702170439-create-productos.cjs (36 líneas)

```js
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

```

---

### src/migrations/20250702170441-create-promociones.cjs (27 líneas)

```js
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

```

---

### src/migrations/20250702170442-create-compras.cjs (47 líneas)

```js
'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('compras', {
      id:          { type: S.INTEGER, primaryKey: true, autoIncrement: true },

      /* ── FK ─────────────────────────────── */
      usuarioId: {
        type: S.INTEGER,
        allowNull: true,                 // ← debe admitir NULL
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      productoId: {
        type: S.INTEGER,
        allowNull: true,                 // ← debe admitir NULL
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      promo_aplicada: {
        type: S.INTEGER,
        allowNull: true,
        references: { model: 'promociones', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      /* ── Datos de la compra ─────────────── */
      qty:         { type: S.INTEGER,       allowNull: false },
      precio_unit: { type: S.DECIMAL(10,2), allowNull: false },
      subtotal:    { type: S.DECIMAL(10,2), allowNull: false },
      fecha:       { type: S.DATE, allowNull: false,
                     defaultValue: S.literal('CURRENT_TIMESTAMP') }
    });

    await qi.addIndex('compras', ['usuarioId', 'productoId'],
                      { name: 'idx_historial' });
  },

  down: async (qi) => {
    await qi.dropTable('compras');
  }
};

```

---

### src/migrations/20250702170444-create-cuentas-corrientes.cjs (30 líneas)

```js
'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('cuentas_corrientes', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },

      usuarioId: {
        type: S.INTEGER,
        allowNull: true,                 // ← ahora admite NULL
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      saldo:   { type: S.DECIMAL(10,2), allowNull: false, defaultValue: 0.00 },
      credito: { type: S.DECIMAL(10,2), allowNull: false, defaultValue: 0.00 },
      actualizado_en: {
        type: S.DATE,
        allowNull: false,
        defaultValue: S.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (qi) => {
    await qi.dropTable('cuentas_corrientes');
  }
};

```

---

### src/migrations/20250702170446-create-productos-promociones.cjs (27 líneas)

```js
'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('productos_promociones', {
      productoId:  {
        type: S.INTEGER,
        primaryKey: true,
        references: { model: 'productos', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      promocionId: {
        type: S.INTEGER,
        primaryKey: true,
        references: { model: 'promociones', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      }
    });
  },

  down: async (qi) => {
    await qi.dropTable('productos_promociones');
  }
};

```

---

### src/migrations/20250702170448-create-feedback.cjs (26 líneas)

```js
'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('feedback', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },

      usuarioId: {
        type: S.INTEGER,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      flow_id:    { type: S.STRING },
      satisfecho: { type: S.STRING },
      comentario: { type: S.TEXT },
      creado_en:  { type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') }
    });
  },

  down: async (qi) => {
    await qi.dropTable('feedback');
  }
};

```

---

### src/migrations/20250702170449-create-precios-log.cjs (33 líneas)

```js
'use strict';

module.exports = {
  up: async (qi, S) => {
    await qi.createTable('precios_log', {
      id:              { type: S.INTEGER, primaryKey: true, autoIncrement: true },

      productoId: {
        type: S.INTEGER,
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      cambiado_por: {
        type: S.INTEGER,
        references: { model: 'usuarios', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      precio_anterior: { type: S.DECIMAL(10,2), allowNull: false },
      nuevo_precio:    { type: S.DECIMAL(10,2), allowNull: false },
      motivo:          { type: S.TEXT },
      cambiado_en:     { type: S.DATE, allowNull: false, defaultValue: S.literal('CURRENT_TIMESTAMP') }
    });
  },

  down: async (qi) => {
    await qi.dropTable('precios_log');
  }
};


```

---

### src/migrations/20250703181610-rename-promos-fechas.cjs (13 líneas)

```js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('promociones', 'inicio', 'vigencia_desde');
    await queryInterface.renameColumn('promociones', 'fin', 'vigencia_hasta');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn('promociones', 'vigencia_desde', 'inicio');
    await queryInterface.renameColumn('promociones', 'vigencia_hasta', 'fin');
  }
};
```

---

### src/migrations/20250704164411-change-regalo-to-text-in-promociones.cjs (21 líneas)

```js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // agrandamos “regalo” a TEXT
    await queryInterface.changeColumn('promociones', 'regalo', {
      type     : Sequelize.TEXT,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // revertimos a VARCHAR(255)
    await queryInterface.changeColumn('promociones', 'regalo', {
      type     : Sequelize.STRING,
      allowNull: true
    });

  }
};

```

---

### src/migrations/20250724181524-crear-ejecutivos-cuenta.cjs (26 líneas)

```js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ejecutivos_cuenta', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      telefono: {
        type: Sequelize.STRING,
        allowNull: false
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('ejecutivos_cuenta');
  }
};

```

---

### src/migrations/20250725123944-add-password-to-usuarios.cjs (16 líneas)

```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'password', {
      type: Sequelize.STRING,
      allowNull: true, // Por ahora lo dejamos opcional
      after: 'email'   // Opcional: depende del motor si lo respeta
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'password');
  }
};

```

---

### src/migrations/20250804144109-add_email_to_ejecutivos_cuenta.cjs (25 líneas)

```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ejecutivos_cuenta', 'email', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'telefono' 
    });

    await queryInterface.changeColumn('ejecutivos_cuenta', 'telefono', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ejecutivos_cuenta', 'email');
    await queryInterface.changeColumn('ejecutivos_cuenta', 'telefono', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};

```

---

### src/migrations/20250804152107-add_ejecutivoId_to_usuarios.cjs (21 líneas)

```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'ejecutivoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'ejecutivos_cuenta',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('usuarios', 'ejecutivoId');
  }
};

```

---

### src/migrations/20250804154916-change_phone_nullable_in_usuarios.cjs (22 líneas)

```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Cambiar phone para permitir null
    await queryInterface.changeColumn('usuarios', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir a NOT NULL (lo original)
    await queryInterface.changeColumn('usuarios', 'phone', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });
  }
};

```

---

### src/migrations/20251020130144-create-whatsapp-sessions.cjs (60 líneas)

```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('whatsapp_sessions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
      },
      phone: {
        type: Sequelize.STRING(32),
        allowNull: false,
        unique: true
      },
      cuit: {
        type: Sequelize.STRING(11),
        allowNull: true
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING(32),
        allowNull: false,
        defaultValue: 'idle'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        // Si querés ON UPDATE automático en MySQL 8:
        // defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    });

    await queryInterface.addIndex('whatsapp_sessions', ['expires_at'], {
      name: 'idx_whatsapp_sessions_expires_at'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('whatsapp_sessions');
  }
};

```

---

### src/migrations/20251023130154-add-pending-to-whatsapp-sessions.cjs (31 líneas)

```js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'whatsapp_sessions';
    const col   = 'pending';

    // Verificar esquema actual para evitar errores si ya existe
    const desc = await queryInterface.describeTable(table);

    if (!desc[col]) {
      // MySQL 5.7+ y Postgres soportan JSON sin drama
      await queryInterface.addColumn(table, col, {
        type: Sequelize.JSON,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const table = 'whatsapp_sessions';
    const col   = 'pending';

    // Remover sólo si existe (idempotente)
    const desc = await queryInterface.describeTable(table);
    if (desc[col]) {
      await queryInterface.removeColumn(table, col);
    }
  }
};

```

---

### src/migrations/20251023130155-add-cols-feedback-meta.cjs (18 líneas)

```js
// db/migrations/XXXX-add-cols-feedback-meta.js
'use strict';
module.exports = {
  async up(qi, S) {
    const t = 'feedback';
    const d = await qi.describeTable(t);
    if (!d.phone)    await qi.addColumn(t, 'phone',   { type: S.STRING(32), allowNull: true });
    if (!d.cuit)     await qi.addColumn(t, 'cuit',    { type: S.STRING(11), allowNull: true });
    if (!d.origen)   await qi.addColumn(t, 'origen',  { type: S.STRING, allowNull: true, defaultValue: 'whatsapp' });
  },
  async down(qi) {
    const t = 'feedback'; const d = await qi.describeTable(t);
    if (d.origen) await qi.removeColumn(t, 'origen');
    if (d.cuit)   await qi.removeColumn(t, 'cuit');
    if (d.phone)  await qi.removeColumn(t, 'phone');
  }
};

```

---

### src/migrations/20251023130156-add-feedback-cooldown-cols.cjs (21 líneas)

```js
// db/migrations/XXXX-add-feedback-cooldown-cols.js
'use strict';
module.exports = {
  async up(qi, S) {
    const t = 'whatsapp_sessions';
    const d = await qi.describeTable(t);
    if (!d.feedback_last_prompt_at) {
      await qi.addColumn(t, 'feedback_last_prompt_at',   { type: S.DATE, allowNull: true });
    }
    if (!d.feedback_last_response_at) {
      await qi.addColumn(t, 'feedback_last_response_at', { type: S.DATE, allowNull: true });
    }
  },
  async down(qi) {
    const t = 'whatsapp_sessions';
    const d = await qi.describeTable(t);
    if (d.feedback_last_response_at) await qi.removeColumn(t, 'feedback_last_response_at');
    if (d.feedback_last_prompt_at)   await qi.removeColumn(t, 'feedback_last_prompt_at');
  }
};

```

---

### src/models/Compra.js (18 líneas)

```js
// src/models/Compra.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Compra = sequelize.define('Compra', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  qty:         { type: DataTypes.INTEGER, allowNull: false },
  precio_unit: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  subtotal:    { type: DataTypes.DECIMAL(10,2), allowNull: false }
}, {
  tableName: 'compras',
  timestamps: true,
  createdAt: 'fecha',
  updatedAt: false,
  indexes: [{ fields: ['usuarioId', 'productoId'] }]
});


```

---

### src/models/CuentaCorriente.js (16 líneas)

```js
// src/models/CuentaCorriente.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const CuentaCorriente = sequelize.define('CuentaCorriente', {
  id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  saldo:   { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 },
  credito: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0.00 }
}, {
  tableName: 'cuentas_corrientes',
  timestamps: true,
  createdAt: false,
  updatedAt: 'actualizado_en'
});


```

---

### src/models/EjecutivoCuenta.js (12 líneas)

```js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const EjecutivoCuenta = sequelize.define('EjecutivoCuenta', {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:   { type: DataTypes.STRING, allowNull: false },
  phone:    { type: DataTypes.STRING, unique: true, allowNull: true, field: 'telefono' },
  email:    { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'ejecutivos_cuenta',
  timestamps: false
});
```

---

### src/models/Feedback.js (21 líneas)

```js
// src/models/Feedback.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Feedback = sequelize.define('Feedback', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuarioId:   { type: DataTypes.INTEGER, allowNull: true },           // ya está en la migración
  phone:       { type: DataTypes.STRING(32), allowNull: true },        // para mapear conversaciones WA
  cuit:        { type: DataTypes.STRING(11), allowNull: true },
  flow_id:     { type: DataTypes.STRING, allowNull: true },            // ej: 'feedback_inactive'
  satisfecho:  { type: DataTypes.STRING, allowNull: true },            // 'ok' | 'meh' | 'txt'
  comentario:  { type: DataTypes.TEXT, allowNull: true },
  origen:      { type: DataTypes.STRING, allowNull: true, defaultValue: 'whatsapp' } // canal
}, {
  tableName: 'feedback',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false,
  indexes: [{ fields: ['phone'] }, { fields: ['cuit'] }, { fields: ['flow_id'] }]
});

```

---

### src/models/PrecioLog.js (17 líneas)

```js
// src/models/PrecioLog.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const PrecioLog = sequelize.define('PrecioLog', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  precio_anterior: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  nuevo_precio:    { type: DataTypes.DECIMAL(10,2), allowNull: false },
  motivo:          { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'precios_log',
  timestamps: true,
  createdAt: 'cambiado_en',
  updatedAt: false
});


```

---

### src/models/Producto.js (30 líneas)

```js
// src/models/Producto.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Producto = sequelize.define('Producto', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_articulo:   { type: DataTypes.STRING, unique: true, allowNull: true }, // código KronenVet
  nombre:        { type: DataTypes.STRING, allowNull: false },
  costo:         { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  precio:        { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  presentacion:  { type: DataTypes.STRING, allowNull: true },
  proveedor:     { type: DataTypes.STRING, allowNull: true },
  marca:         { type: DataTypes.STRING, allowNull: true },
  rubro:         { type: DataTypes.STRING, allowNull: true },
  familia:       { type: DataTypes.STRING, allowNull: true },
  debaja:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  cantidad:      { type: DataTypes.INTEGER, allowNull: true },
  stockMin:      { type: DataTypes.INTEGER, allowNull: true },
  stockMax:      { type: DataTypes.INTEGER, allowNull: true },
  codBarras:     { type: DataTypes.STRING, allowNull: true },
  observaciones: { type: DataTypes.TEXT, allowNull: true },
  visible:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'productos',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false,
  indexes: [{ fields: ['nombre', 'presentacion', 'marca'] }]
});

```

---

### src/models/ProductoPromocion.js (12 líneas)

```js
// src/models/ProductoPromocion.js  (tabla puente M:N)
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const ProductoPromocion = sequelize.define('ProductoPromocion', {
  productoId:  { type: DataTypes.INTEGER, primaryKey: true },
  promocionId: { type: DataTypes.INTEGER, primaryKey: true }
}, {
  tableName: 'productos_promociones',
  timestamps: false
});

```

---

### src/models/Promocion.js (24 líneas)

```js
// src/models/Promocion.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Promocion = sequelize.define('Promocion', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:           { type: DataTypes.STRING, allowNull: false },
  tipo:             { type: DataTypes.STRING, allowNull: true },
  detalle:          { type: DataTypes.TEXT, allowNull: true },
  regalo:           { type: DataTypes.TEXT, allowNull: true },
  presentacion:     { type: DataTypes.STRING, allowNull: true },
  especie:          { type: DataTypes.STRING, allowNull: true },
  laboratorio:      { type: DataTypes.STRING, allowNull: true },
  productos_txt:    { type: DataTypes.TEXT, allowNull: true }, 
  stock_disponible: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  vigencia_desde:   { type: DataTypes.DATE, allowNull: true },
  vigencia_hasta:   { type: DataTypes.DATE, allowNull: true },
  vigente:          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
}, {
  tableName: 'promociones',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false
});
```

---

### src/models/Usuario.js (19 líneas)

```js
// src/models/Usuario.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

export const Usuario = sequelize.define('Usuario', {
  id:        { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre:    { type: DataTypes.STRING, allowNull: true },
  phone:     { type: DataTypes.STRING, unique: true, allowNull: true }, // WhatsApp
  cuit:      { type: DataTypes.STRING, unique: true, allowNull: true },   // autenticación
  email:     { type: DataTypes.STRING, unique: true, allowNull: true },
  password:  { type: DataTypes.STRING, allowNull: true },
  role:      { type: DataTypes.STRING, allowNull: false, defaultValue: 'vet' },
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'creado_en',
  updatedAt: false
});

```

---

### src/models/WhatsAppSession.js (30 líneas)

```js
// src/models/WhatsAppSession.js
import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const WhatsAppSession = sequelize.define('WhatsAppSession', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  phone:       { type: DataTypes.STRING(32), allowNull: false, unique: true },
  cuit:        { type: DataTypes.STRING(11), allowNull: true },
  verifiedAt:  { type: DataTypes.DATE, allowNull: true, field: 'verified_at' },
  expiresAt:   { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },
  state:       { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'idle' },
  pending:     { type: DataTypes.JSON, allowNull: true },

  feedbackLastPromptAt:   { type: DataTypes.DATE, allowNull: true, field: 'feedback_last_prompt_at' },
  feedbackLastResponseAt: { type: DataTypes.DATE, allowNull: true, field: 'feedback_last_response_at' }
}, {
  tableName: 'whatsapp_sessions',
  underscored: true,
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['phone'], unique: true },
    { fields: ['expires_at'] },
    { fields: ['feedback_last_prompt_at'] },
    { fields: ['feedback_last_response_at'] }
  ]
});

export default WhatsAppSession;
```

---

### src/models/index.js (75 líneas)

```js
// src/models/index.js
import sequelize from '../../config/database.js';

/* ─── Modelos ─────────────────────────────────── */
import { Usuario }          from './Usuario.js';
import { CuentaCorriente }  from './CuentaCorriente.js';
import { Producto }         from './Producto.js';
import { Promocion }        from './Promocion.js';
import { ProductoPromocion } from './ProductoPromocion.js';
import { Compra }           from './Compra.js';
import { Feedback }         from './Feedback.js';
import { PrecioLog }        from './PrecioLog.js';
import { EjecutivoCuenta } from './EjecutivoCuenta.js';
import WhatsAppSession from './WhatsAppSession.js';

/* ─── Asociaciones ────────────────────────────── */
/** 1 : 1  (Usuario ↔ CuentaCorriente) */
Usuario.hasOne(CuentaCorriente,   { foreignKey: 'usuarioId' });
CuentaCorriente.belongsTo(Usuario,{ foreignKey: 'usuarioId' });

/** 1 : N  (Usuario ↔ Compra) */
Usuario.hasMany(Compra,           { foreignKey: 'usuarioId' });
Compra.belongsTo(Usuario,         { foreignKey: 'usuarioId' });

/** 1 : N  (Producto ↔ Compra) */
Producto.hasMany(Compra,          { foreignKey: 'productoId' });
Compra.belongsTo(Producto,        { foreignKey: 'productoId' });
/** 1 : N  (EjecutivoCuenta ↔ Usuario) */
EjecutivoCuenta.hasMany(Usuario,    { foreignKey: 'ejecutivoId' });
Usuario.belongsTo(EjecutivoCuenta,  { foreignKey: 'ejecutivoId' });

/** 1 : N  (Promocion ↔ Compra) – promo aplicada en la compra */
Promocion.hasMany(Compra,         { foreignKey: 'promo_aplicada' });
Compra.belongsTo(Promocion,       { foreignKey: 'promo_aplicada' });

/** 1 : N  (Usuario ↔ Feedback) */
Usuario.hasMany(Feedback,         { foreignKey: 'usuarioId' });
Feedback.belongsTo(Usuario,       { foreignKey: 'usuarioId' });

/** 1 : N  (Producto ↔ PrecioLog) */
Producto.hasMany(PrecioLog,       { foreignKey: 'productoId' });
PrecioLog.belongsTo(Producto,     { foreignKey: 'productoId' });

/** 1 : N  (Usuario admin ↔ PrecioLog) */
Usuario.hasMany(PrecioLog,        { foreignKey: 'cambiado_por' });
PrecioLog.belongsTo(Usuario,      { foreignKey: 'cambiado_por' });


/** M : N  (Producto ↔ Promocion)  */
Producto.belongsToMany(Promocion, {
  through: ProductoPromocion,
  foreignKey: 'productoId',
  otherKey:   'promocionId'
});
Promocion.belongsToMany(Producto, {
  through: ProductoPromocion,
  foreignKey: 'promocionId',
  otherKey:   'productoId'
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
  WhatsAppSession
};

```

---

### src/seeders/20250725133523-admin-usuario.cjs (28 líneas)

```js
'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const password = await bcrypt.hash('admin1234!', 10);

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Administrador General',
        phone: '5491100000000',
        cuit: null,
        email: 'admin@example.com',
        password,
        role: 'admin',
        creado_en: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('usuarios', {
      email: 'admin@example.com'
    }, {});
  }
};

```