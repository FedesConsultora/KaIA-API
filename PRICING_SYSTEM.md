# Sistema de Precios con Descuentos (Condiciones Comerciales)

## 📋 Descripción General

KaIA ahora aplica automáticamente descuentos personalizados basados en **Condiciones Comerciales** asignadas a cada cliente. Los precios mostrados en WhatsApp siempre reflejan el precio final con descuento aplicado, nunca el precio de lista.

---

## 🏗️ Estructura de Datos

### Tablas Principales

1. **`condiciones_comerciales`**
   - Almacena las plantillas de condiciones (ej: COND-22, COND-10)
   - Campos: `codigo`, `nombre`, `descripcion`, `vigencia_desde/hasta`

2. **`condicion_comercial_reglas`**
   - Define las reglas de descuento para cada condición
   - Soporta descuentos por: Rubro, Familia, Marca, o Producto específico
   - Campos: `condicionId`, `rubro`, `familia`, `marca`, `productoId`, `porcentaje_descuento`

3. **`usuarios_condiciones_comerciales`**
   - Tabla de relación M:N entre usuarios y condiciones
   - Campos: `usuarioId`, `condicionId`, `vigente_desde/hasta`, `es_principal`

---

## 🔄 ¿Cómo Funciona?

### Flujo de Cálculo de Precio

```
Usuario busca producto en WhatsApp
          ↓
Sistema identifica al usuario autenticado
          ↓
Busca condiciones comerciales asignadas
          ↓
Para cada producto:
  - Si tiene condición → Aplica descuento según reglas
  - Sin condición → Usa precio de lista
          ↓
Muestra precio final (CON descuento)
```

### Prioridad de Reglas

Cuando un producto coincide con múltiples reglas, se aplica la **más específica**:

1. **Producto específico** (mayor prioridad)
2. **Marca**
3. **Familia**
4. **Rubro** (menor prioridad)

---

## 🛠️ Scripts Disponibles

### 1. Importar Condiciones Comerciales

Importa las plantillas de condiciones desde el Excel "Plantillas de Condiciones".

```bash
docker compose exec app node src/dev/import-condiciones-comerciales.js src/dev/PlantillasCondiciones.xlsx
```

**¿Qué hace?**
- Lee el Excel con las plantillas de descuentos
- Parsea descripciones como "20% dto EN MARCA Genéricos"
- Crea registros en `condiciones_comerciales` y `condicion_comercial_reglas`

### 2. Asignar Condiciones a Usuarios

Asigna las condiciones comerciales a los usuarios según el Excel "Clientes 2025".

```bash
docker compose exec app node src/dev/import-usuarios-condiciones.js src/dev/ClientesCondiciones.xlsx
```

**¿Qué hace?**
- Lee todas las hojas del Excel (una por ejecutivo)
- Busca usuarios por razón social
- Asigna la condición comercial correspondiente (COND-XX)
- Si ya existe la asignación, la actualiza

### 3. Generar Reporte

Genera un reporte completo de ejecutivos, clientes y condiciones asignadas.

```bash
docker compose exec app node src/dev/reporte-ejecutivos-condiciones.js src/dev/ClientesCondiciones.xlsx
```

**Salida:** `src/dev/reporte-ejecutivos.md`

---

## 📝 Cómo Actualizar Condiciones

### Escenario 1: Cambiar Descuentos de una Condición Existente

1. **Modificá el Excel** "Plantillas de Condiciones"
2. **Ejecutá el import** (sobrescribe las reglas existentes):
   ```bash
   docker compose exec app node src/dev/import-condiciones-comerciales.js src/dev/PlantillasCondiciones.xlsx
   ```
3. **Verificá** en el admin panel: `/admin/condiciones`

### Escenario 2: Reasignar Condiciones a Clientes

1. **Modificá el Excel** "ClientesCondiciones.xlsx"
2. **Ejecutá el import** (actualiza las asignaciones):
   ```bash
   docker compose exec app node src/dev/import-usuarios-condiciones.js src/dev/ClientesCondiciones.xlsx
   ```
3. **Verificá** en el admin panel: `/admin/usuarios` (columna "Condición")

### Escenario 3: Crear Nueva Condición

1. **Agregá la condición** en "Plantillas de Condiciones" (ej: COND-50)
2. **Importá las plantillas** (paso 1 del Escenario 1)
3. **Asignala a clientes** editando "ClientesCondiciones.xlsx"
4. **Importá las asignaciones** (paso 2 del Escenario 2)

---

## ❓ Preguntas Frecuentes

### ¿Qué pasa si ejecuto el import dos veces?

**Respuesta:** Es seguro. Los scripts usan `findOrCreate` y `updateOnDuplicate`:
- **Condiciones:** Se actualizan las reglas existentes
- **Usuarios:** Se actualiza la fecha de vigencia si ya existe

### ¿Cómo elimino una condición?

**Opción 1 (Recomendado):** Desde el admin panel
- Ve a `/admin/condiciones`
- Click en el botón 🗑️ de la condición
- Confirmá

**Opción 2:** SQL directo
```sql
DELETE FROM condiciones_comerciales WHERE codigo = 'COND-XX';
```

### ¿Cómo veo qué descuento tiene un usuario?

**Panel Admin:**
1. Ve a `/admin/usuarios`
2. Buscá el usuario
3. Columna "Condición" muestra el código (ej: COND-22)
4. Click en el código para ver detalles

**O desde Ejecutivos:**
1. Ve a `/admin/ejecutivos`
2. Click en 👥 "Ver clientes" del ejecutivo
3. Verás todos sus clientes con sus condiciones

### ¿Los precios en WhatsApp son siempre con descuento?

**Sí.** Desde la integración del pricing service:
- Los usuarios **CON condición** ven precios con descuento
- Los usuarios **SIN condición** ven precio de lista
- **Nunca** se muestra "precio de lista" si hay descuento disponible

### ¿Se guarda el precio correcto en las compras?

**Sí.** Cuando un usuario registra una compra, se guarda el precio final con descuento aplicado en la tabla `compras` (campo `precio_unit`).

---

## 🧪 Testing

### Test Manual

1. **Verificar descuentos en WhatsApp:**
   - Autenticarse con un usuario que tenga condición (ej: COND-22)
   - Buscar un producto que aplique descuento
   - Verificar que el precio mostrado sea menor al precio de lista

2. **Verificar precio en compra:**
   - Completar una compra desde WhatsApp
   - Consultar en MySQL:
     ```sql
     SELECT c.*, p.precio AS precio_lista 
     FROM compras c 
     JOIN productos p ON c.productoId = p.id 
     WHERE c.usuarioId = [ID_USUARIO] 
     ORDER BY c.fecha DESC LIMIT 1;
     ```
   - El `precio_unit` debe ser menor o igual al `precio_lista`

### Test SQL

```sql
-- Ver usuarios con condiciones
SELECT u.nombre, e.nombre AS ejecutivo, cc.codigo AS condicion
FROM usuarios u
LEFT JOIN ejecutivos_cuenta e ON u.ejecutivoId = e.id
LEFT JOIN usuarios_condiciones_comerciales ucc ON u.id = ucc.usuarioId
LEFT JOIN condiciones_comerciales cc ON ucc.condicionId = cc.id
ORDER BY e.nombre, u.nombre;

-- Ver reglas de una condición específica
SELECT * FROM condicion_comercial_reglas 
WHERE condicionId = (SELECT id FROM condiciones_comerciales WHERE codigo = 'COND-22');
```

---

## 🔒 Información de Stock

> **IMPORTANTE:** KaIA **nunca muestra información de stock** a los clientes en WhatsApp, solo precios.

Esto incluye:
- ❌ No mostrar "disponible" o "en stock"
- ❌ No mostrar cantidades disponibles
- ❌ No filtrar productos por `debaja` o `cantidad`

---

## 📚 Archivos Relacionados

### Backend
- `src/services/pricingService.js` - Lógica de cálculo de descuentos
- `src/services/disambiguationService.js` - Integración en búsqueda de productos
- `src/controllers/compraController.js` - Integración en registro de compras

### Scripts
- `src/dev/import-condiciones-comerciales.js`
- `src/dev/import-usuarios-condiciones.js`
- `src/dev/reporte-ejecutivos-condiciones.js`

### Admin Panel
- `src/controllers/admin/condicionesController.js`
- `src/views/admin/condiciones/` - Vistas del admin

---

## 🎯 Resumen

**¿Qué cambió?**
- KaIA ahora muestra precios personalizados según la condición comercial del cliente
- Los descuentos se calculan automáticamente con reglas multi-dimensionales
- Los precios en compras reflejan los descuentos aplicados
- Se eliminó toda referencia a stock en mensajes

**¿Qué NO cambió?**
- La autenticación sigue siendo por CUIT
- El flujo de conversación es el mismo
- Los productos y promociones funcionan igual
