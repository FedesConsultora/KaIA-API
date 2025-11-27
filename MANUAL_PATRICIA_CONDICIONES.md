# MANUAL DE GESTIÓN DE CONDICIONES COMERCIALES
## KrönenVet - Guía para Patricia

---

## 📋 ÍNDICE

1. ¿Qué son las condiciones comerciales?
2. Acceso al sistema
3. Gestión de condiciones
4. Gestión de reglas de descuento
5. Asignación a clientes
6. Ejemplos prácticos
7. Preguntas frecuentes

---

## 1. ¿QUÉ SON LAS CONDICIONES COMERCIALES?

Las **condiciones comerciales** son conjuntos de descuentos que se aplican automáticamente a ciertos productos para clientes específicos.

### Componentes:
- **Condición**: Ej: "COND-51"
- **Reglas**: Definen QUÉ productos tienen descuento y CUÁNTO
- **Asignaciones**: Definen QUÉ clientes tienen cada condición

### Ejemplo:
```
Cliente: Veterinaria Central
Condición: COND-51
Reglas:
  - FARMACIA: 20% descuento
  - ALIMENTO: 5% descuento
  - Marca BAYER: 25% descuento
```

Cuando este cliente busca productos en WhatsApp, ve automáticamente los precios con descuento.

---

## 2. ACCESO AL SISTEMA

### Ingresar al panel de administración:

1. Abrir navegador (Chrome, Firefox, Edge)
2. Ir a: `https://tu-dominio.com/admin`
3. Usuario: `tu-email@kronenvet.com`
4. Contraseña: `tu-contraseña`
5. Click "Iniciar Sesión"

![Pantalla de login]

---

## 3. GESTIÓN DE CONDICIONES

### 3.1 Ver todas las condiciones

1. En el menú lateral, click "Condiciones Comerciales"
2. Verás una tabla con todas las condiciones existentes:
   - Código (ej: COND-22)
   - Nombre
   - Descripción
   - Cantidad de reglas
   - Fecha de vigencia

### 3.2 Crear nueva condición

**Paso 1:** Click botón verde "Nueva Condición"

**Paso 2:** Llenar formulario:
```
Código *: COND-51
Nombre *: Farmacia 20% - Alimento 5%
Descripción: Condición especial para clientes grandes
Vigencia Desde: 2025-01-01
Vigencia Hasta: (dejar vacío si no caduca)
```

**Paso 3:** Click "Guardar Condición"

✅ La condición se crea, pero aún NO tiene reglas

### 3.3 Editar condición existente

1. En la lista de condiciones
2. Click botón azul ✏️ (lápiz) al lado de la condición
3. Modificar datos
4. Click "Guardar Condición"

### 3.4 Eliminar condición

⚠️ **CUIDADO**: Esto elimina la condición Y todas sus reglas

1. En la lista de condiciones
2. Click botón rojo 🗑️ (basura)
3. Confirmar eliminación
4. ✅ Condición eliminada

---

## 4. GESTIÓN DE REGLAS DE DESCUENTO

### 4.1 ¿Cómo funcionan las reglas?

Las reglas tienen 4 niveles (del más general al más específico):

#### NIVEL 1: RUBRO (Toda una categoría)
```
Ejemplo: Todos los productos de FARMACIA
Llenar:
  - Rubro: FARMACIA
  - Descuento: 20
Dejar vacío:
  - Familia, Marca, Código de Producto
```

#### NIVEL 2: FAMILIA (Más específico)
```
Ejemplo: Solo antibióticos
Llenar:
  - Rubro: FARMACIA
  - Familia: ANTIBIOTICOS
  - Descuento: 22
Dejar vacío:
  - Marca, Código de Producto
```

#### NIVEL 3: MARCA/LABORATORIO
```
Ejemplo: Solo productos BAYER
Llenar:
  - Marca: BAYER
  - Descuento: 25
Dejar vacío:
  - Rubro, Familia, Código de Producto
```

#### NIVEL 4: PRODUCTO ESPECÍFICO (Máxima prioridad)
```
Ejemplo: Solo el producto ART-12345
Llenar:
  - Código de Producto: ART-12345
  - Descuento: 30
Dejar vacío:
  - Rubro, Familia, Marca
```

**⚠️ IMPORTANTE: ¿Dónde encuentro el código del producto?**

El código de producto es el **código KronenVet** que aparece en la ficha del producto (campo `id_articulo`).

**Cómo encontrarlo:**
1. Ir a "Productos" en el menú del admin
2. Buscar el producto que necesitas
3. Ver la columna "Código" o abrir la ficha del producto
4. Copiar exactamente el código que aparece
5. Pegarlo en "Código de Producto" al crear la regla

**Ejemplo:**
- Producto: "BRAVECTO 10-20kg"  
- Código KronenVet: "ART-12345"  
- Usar en regla: `ART-12345`

### 4.2 Agregar regla a una condición

**Paso 1:** Editar la condición (click botón azul ✏️)

**Paso 2:** Scroll hacia abajo hasta "Reglas de Descuento"

**Paso 3:** Click botón "Agregar Regla"

**Paso 4:** En el formulario que aparece:

```
Para descuento general en FARMACIA:
  Rubro: FARMACIA
  Familia: (dejar vacío)
  Marca: (dejar vacío)
  Código de Producto: (dejar vacío)
  Descuento (%): 20
```

**Paso 5:** Click "Guardar Regla"

✅ La regla se crea y aparece en la tabla

### 4.3 Ver reglas existentes

1. Editar una condición
2. Scroll a "Reglas de Descuento"
3. Verás tabla con todas las reglas:
   - Badges de colores muestran qué criterios están definidos
   - Porcentaje de descuento en verde
   - Botón rojo 🗑️ para eliminar

### 4.4 Eliminar regla

1. En la tabla de reglas
2. Click botón rojo 🗑️
3. Confirmar
4. ✅ Regla eliminada

---

## 5. ASIGNACIÓN A CLIENTES

### 5.1 Asignar condición a un cliente

**OPCIÓN A: Desde el cliente**

**Paso 1:** Ir a "Usuarios" en el menú

**Paso 2:** Click botón ✏️ del cliente a modificar

**Paso 3:** En el formulario, buscar "Condición Comercial"

**Paso 4:** Seleccionar del menú desplegable:
```
-- Sin condición especial --
COND-4 - Farmacia Lista - Alimento 20%
COND-22 - Farmacia 8% - Alimento 9%
COND-51 - Farmacia 20% - Alimento 5%
```

**Paso 5:** Click "Guardar Usuario"

✅ El cliente ahora tiene esa condición asignada

---

**OPCIÓN B: Importación masiva desde Excel**

**Paso 1:** Ir a "Condiciones Comerciales"

**Paso 2:** En la sección "Importar desde Excel"

**Paso 3:** Buscar "2. Asignar Condiciones a Usuarios"

**Paso 4:** Click "Seleccionar archivo" y subir Excel con estructura:
```
| RAZON SOCIAL          | ID |
|-----------------------|----|
| Veterinaria Central   | 22 |
| Clínica San Martín    | 51 |
| Hospital Veterinario  | 4  |
```

**Paso 5:** Click "Asignar"

✅ Verás mensaje: "✅ Asignación completada: X usuarios actualizados"

### 5.2 Ver qué clientes tienen una condición

**Paso 1:** Ir a "Condiciones Comerciales"

**Paso 2:** Click botón 👥 (personas) al lado de la condición

**Paso 3:** Verás lista de todos los clientes con esa condición

---

## 6. EJEMPLOS PRÁCTICOS

### EJEMPLO 1: Condición simple

**Cliente dice:** "Dale 15% en toda la farmacia"

**Patricia hace:**

1. Crear condición:
   - Código: `COND-FARM15`
   - Nombre: `Farmacia 15%`

2. Agregar regla:
   - Rubro: `FARMACIA`
   - Descuento: `15`

3. Asignar al cliente en su ficha

✅ Listo. Cliente ve 15% OFF en todos los productos de farmacia.

---

### EJEMPLO 2: Condición con excepción por marca

**Cliente dice:** "15% en farmacia en general, pero productos BAYER con 20%"

**Patricia hace:**

1. Crear condición: `COND-FARM15-BAYER20`

2. Agregar regla general:
   - Rubro: `FARMACIA`
   - Descuento: `15`

3. Agregar regla para Bayer:
   - Marca: `BAYER`
   - Descuento: `20`

4. Asignar al cliente

**Resultado:**
- Producto Pfizer (farmacia) → 15% OFF
- Producto Bayer (farmacia) → 20% OFF ✅ (la marca gana)

---

### EJEMPLO 3: Condición múltiple

**Cliente dice:** "20% farmacia, 5% alimento, 25% en productos Bayer, pero el producto #456 tiene 30%"

**Patricia hace:**

1. Crear condición: `COND-ESPECIAL`

2. Agregar 4 reglas:
   
   **Regla 1 - Farmacia general:**
   - Rubro: `FARMACIA`
   - Descuento: `20`
   
   **Regla 2 - Alimento general:**
   - Rubro: `ALIMENTO`
   - Descuento: `5`
   
   **Regla 3 - Marca Bayer:**
   - Marca: `BAYER`
   - Descuento: `25`
   
   **Regla 4 - Producto específico:**
   - Código de Producto: `456`
   - Descuento: `30`

3. Asignar al cliente

**Resultado:**
- Farmacia genérica → 20%
- Alimento → 5%
- Bayer → 25%
- Producto #456 → 30% (máxima prioridad)

---

## 7. PREGUNTAS FRECUENTES

### ¿Cómo sé qué Rubro/Familia/Marca poner?

Ve a "Productos" y busca el producto. Ahí verás sus datos:
- Rubro
- Familia
- Marca

Copia exactamente como aparece.

### ¿Puedo poner nombres en minúsculas?

No importa. El sistema convierte automáticamente a MAYÚSCULAS:
- "farmacia" → "FARMACIA"
- "bayer" → "BAYER"

### ¿Qué pasa si dejo todo en blanco?

Error. Debes llenar AL MENOS uno de:
- Rubro
- Familia
- Marca
- Código de Producto

### ¿Puedo tener varias condiciones por cliente?

Por ahora, cada cliente tiene UNA condición principal.
Pero UNA condición puede tener MUCHAS reglas.

### ¿Los descuentos se acumulan?

No. Si un producto coincide con varias reglas, se usa LA MÁS ESPECÍFICA:
- Producto específico (30%) > Marca (25%) > Familia (22%) > Rubro (20%)

### ¿Cómo elimino todas las condiciones para empezar de cero?

1. Ir a "Condiciones Comerciales"
2. Scroll a "Herramientas de Limpieza"
3. Click "Eliminar Todo"
4. Confirmar (⚠️ irreversible)

---

## 8. IMPORTACIÓN MASIVA

### Importar plantillas de condiciones

**Cuándo:** Cuando tienes un Excel con muchas condiciones nuevas

**Archivo Excel debe tener:**
```
| IDDTO | DESCRIPCION                    |
|-------|--------------------------------|
| 22    | FARMACIA 8% - ALIMENTO 9%      |
| 51    | FARMACIA 20% - ALIMENTO 5%     |
```

**Proceso:**
1. Ir a "Condiciones Comerciales"
2. "1. Importar Plantillas de Condiciones"
3. Seleccionar archivo Excel
4. Click "Importar"
5. ✅ Se crean condiciones con reglas automáticamente parseadas

**Nota:** "FARMACIA LISTA" se ignora (= sin descuento)

---

## TIPS IMPORTANTES

✅ **Siempre verifica:**
- Después de crear regla, busca producto en WhatsApp para confirmar descuento
- Revisa la tabla de reglas para asegurarte que todo está correcto

✅ **Mantén orden:**
- Usa códigos consistentes: COND-22, COND-51, etc.
- Nombres descriptivos: "Farmacia 20% - Alimento 5%"

✅ **Backup antes de eliminar:**
- Si vas a hacer "Eliminar Todo", exporta Excel primero

✅ **Documenta excepciones:**
- Si un cliente tiene descuentos raros, anotalo en "Descripción"

---

## SOPORTE

¿Problemas o dudas?

1. **Revisar este manual** primero
2. **Buscar en la tabla** si la condición ya existe
3. **Contactar IT** si hay errores del sistema

---

**Versión:** 1.0
**Fecha:** Noviembre 2025
**Sistema:** KaIA - KrönenVet
