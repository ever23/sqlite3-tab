# sqlite3-tab AI Skill (Gestor de Base de Datos)

Esta skill define las instrucciones y patrones de uso recomendados para la librería **sqlite3-tab**. Utiliza estos principios para que cualquier agente de IA gestione la persistencia de datos de manera eficiente, segura y consistente.

## 1. Inicialización y Registro de Modelos

Para comenzar, instancia la conexión y registra los modelos definidos con `tabla-model`. Esto activa la gestión automática del esquema (creación de tablas e inserción de datos iniciales).

```javascript
import sqlite from 'sqlite3-tab';
import path from 'path';

// 1. Conexión
const db = new sqlite('database.sqlite'); // O ':memory:' para pruebas

// 2. Carga Masiva de Modelos (Recomendado)
db.pathModels(path.join(process.cwd(), 'model'));

// 3. O Registro Individual
// import usuarioModelo from './model/usuarios.js';
// db.addModel(usuarioModelo);

// 4. Obtención de una instancia de tabla
const usuarios = db.tabla('usuarios');
```

## 2. Operaciones CRUD Básicas

### Inserción
```javascript
await usuarios.insert({ 
    user: 'admin', 
    hash: 'argon2...', 
    nombre: 'Administrador', 
    tipo: 'root' 
});
```

### Consultas Select: Sintaxis de Objeto ?nico (REGLA MANDATORIA PARA EL AGENTE)

**Prioridad Absoluta:** Usa **siempre** la sintaxis de objeto ?nico `{ where, campos, joins, order, limit }` al llamar a `.select()`, `.selectOne()` o `.busqueda()`. Esto garantiza cero errores de ambig?edad con par?metros posicionales.

```javascript
// Consulta est?ndar recomendada para el agente:
const resultados = await usuarios.select({
    where: { 
        "estado": "activo", 
        "puntos>": 50,       // Sufijo > para mayor que
        "||nombre%": "A%"    // Prefijo || para OR, sufijo % para LIKE
    },
    campos: ["id", "nombre", "email"],
    joins: { ">perfiles": "perfiles.id_user = usuarios.id" }, // > = LEFT JOIN
    order: "id DESC",
    limit: 10
});
```

#### Operadores en `where`:
* **Sufijos de comparaci?n**: `campo%` (LIKE), `campo!` (!=), `campo>` (>), `campo<` (<), `campo>=` (>=), `campo<=` (<=).
* **Prefijos l?gicos**: `||campo` (OR), `&&campo` (AND por defecto).

<details>
<summary>Sintaxis Posicional Alternativa (Legacy)</summary>

Si usas la firma posicional `select(campos, joins, where)` y deseas filtrar con objeto sin definir campos ni joins, debes pasar `null`:
```javascript
// Posicional: (campos, joins, where)
await usuarios.select(null, null, { "activo": 1 });
```
*(Evita este modo si puedes; prefiere la sintaxis de objeto ?nico)*.
</details>

### Búsqueda Inteligente
Ideal para buscadores globales o filtros de texto.
```javascript
// Busca "Juan" en los campos indicados usando 'LIKE'
const resultados = await usuarios.busqueda("Juan", ["nombre", "user"]);
```

## 3. Patrón Active Record (Instancias Inteligentes)

Todos los resultados de `select()`, `selectOne()` y `busqueda()` son instancias de **Active Record**. Esto significa que cada objeto "sabe" cómo guardarse, actualizarse o eliminarse a sí mismo.

```javascript
// 1. Obtener registro
const user = await usuarios.selectOne("user = 'pedro'");

if (user) {
    // 2. Modificar propiedad directamente
    user.puntos += 10;
    
    // 3. Sincronizar con la DB
    await user.update(); 
    
    // 4. O eliminarlo si es necesario
    // await user.delete();
}
```

## 4. Relaciones (Joins)

Utiliza los prefijos de operador para definir el tipo de JOIN en el objeto de configuración:
- `=` : **INNER JOIN**
- `<` : **LEFT JOIN**
- `>` : **RIGHT JOIN**

```javascript
const datos = await usuarios.select(
  ["usuarios.user", "perfiles.bio"],
  { "<perfiles": "perfiles.id_user = usuarios.id" }, // LEFT JOIN
  "usuarios.id = 1"
);
```

## 5. Directrices Críticas para la IA (AI-Guidelines)

> [!IMPORTANT]
> Sigue estas reglas para evitar errores comunes y maximizar la eficiencia:

1.  **Conoce tu esquema primero**: Antes de realizar cualquier consulta, lee siempre los archivos en el directorio `model/`. Ahí reside la verdad sobre los nombres de columnas y tipos de datos.
2.  **Prefiere `selectOne` para IDs**: Si buscas un registro único por ID o Username, usa siempre `selectOne()`. Devuelve `null` si no existe, evitando el chequeo manual de longitud de arrays.
3.  **Actualizaciones Masivas Seguras**: Para actualizar múltiples registros, usa un `for...of` con `await` sobre el array de resultados para asegurar la atomicidad de cada operación individual.
4.  **Nombres de variables**: Nombra tus instancias de tabla con el nombre de la colección en plural (ej: `const productos = db.tabla('productos')`) para mayor claridad semántica.

## 6. Firma de Métodos Principales

- `selectOne(where, select, join, order)`: Retorna un objeto o `null`.
- `select(campos, joins, where, group, having, order, limit)`: Retorna un array de objetos.
- `insert(datos)`: Inserta un objeto o array de objetos.
- `query(sql)`: Ejecuta SQL nativo (usar solo si la abstracción no es suficiente).

## 7. Sintaxis Avanzada de Filtrado (Where Object)

Al utilizar objetos para el parámetro `where`, puedes usar operadores especiales:
- **Sufijos:** `campo%` (LIKE), `campo!` (!=), `campo>` (>), `campo<` (<), `campo>=` (>=), `campo<=` (<=).
- **Prefijos:** `||campo` (OR), `&&campo` (AND).

### Nota sobre Cadenas Numéricas
Los strings con ceros a la izquierda (ej: `"01"`) se tratan siempre como **strings** (con comillas) para preservar el formato.

> **Peligro de Polimorfismo:**
> Si pasas un objeto como primer argumento en `select()`, se interpretará como **Joins**. Para filtrar por objeto de forma segura:
> `await tabla.select(null, null, { "campo": "valor" });`
>
> **Sintaxis Recomendada (Objeto Único):**
> La forma más limpia es usar un objeto con llaves explícitas:
> `await tabla.select({ where: { activo: 1 }, limit: 5 });`
