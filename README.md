# sqlite3-tab

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]

**sqlite3-tab** es una solución ligera y potente para interactuar con bases de datos SQLite3 en Node.js. Al integrar la potencia de **dbtabla** y **tabla-model**, ofrece una interfaz de alto nivel orientada a objetos (Active Record), ideal para aplicaciones de escritorio, herramientas CLI y prototipado rápido.

## 🚀 Características Principales

*   **Zero Config**: Simplicidad extrema para gestionar bases de datos basadas en archivos.
*   **Patrón Active Record**: Los resultados de las consultas son objetos inteligentes con métodos `.update()` y `.delete()`.
*   **Gestión de Esquemas**: Sincronización automática de tablas basada en modelos definidos.
*   **Fluent Query Builder**: Motor de selección polimórfico con soporte para Joins dinámicos.
*   **Modos de Ejecución**: Soporte para ejecución serializada (`serialize`) nativa de SQLite.
*   **Portabilidad**: API 100% compatible con `mysql-tab`, permitiendo migrar de motor sin cambiar la lógica de negocio.
+
+## 📚 Ecosistema dbtabla
+
+Este paquete forma parte de un ecosistema modular. También puedes utilizar:
+
+*   **[tabla-model](https://github.com/ever23/tabla-model)**: El motor de definición de esquemas (requerido para definir modelos).
+*   **[mysql-tab](https://github.com/ever23/mysql-tab)**: Si necesitas soporte para MySQL/MariaDB.
+*   **[pg-table](https://github.com/ever23/pg-table)**: Si necesitas soporte para PostgreSQL.

---

## 📦 Instalación

```sh
$ npm install sqlite3-tab
```

---

## 🛠️ Inicio Rápido

### 1. Conexión y Configuración
Solo necesitas indicar la ruta del archivo de base de datos. Si no existe, se creará automáticamente.

```javascript
const SQLite = require('sqlite3-tab');

// Ruta al archivo .sqlite o ':memory:' para base de datos en RAM
const db = new SQLite('./database.sqlite');
```

### 2. Definición de Modelos
Utiliza `tabla-model` para definir la estructura de tus datos.

```javascript
// model/Usuario.js
const Model = require('tabla-model');

module.exports = new Model('usuarios', {
    colums: [
        { name: 'id', type: 'integer', primary: true, autoincrement: true },
        { name: 'nombre', type: 'varchar(100)' },
        { name: 'puntos', type: 'integer', default: 0 }
    ]
});
```

Registra tus modelos para que `sqlite3-tab` gestione las tablas por ti:
```javascript
const path = require('path');
db.pathModels(path.join(__dirname, 'model'));
```

---

## 📖 Guía de Uso: Operaciones de Tabla

Obtén una instancia de la tabla para empezar a operar:
```javascript
const usuarios = db.tabla('usuarios');
```

### Inserción de Datos
```javascript
// Inserción por objeto
await usuarios.insert({ nombre: 'Antigravity', puntos: 100 });

// Inserción posicional
await usuarios.insert(null, 'Nuevo Usuario', 50);
```

### Consultas: Sintaxis de Objeto ?nico (Recomendada)
La forma principal y recomendada de realizar consultas en `sqlite3-tab` es pasando un ?nico objeto con propiedades nombradas. Esto elimina cualquier ambig?edad en los par?metros:

```javascript
const resultados = await usuarios.select({
    where: { 
        "puntos>": 50,      // Sufijo > para mayor que
        "||nombre%": "A%"   // Prefijo || para OR, sufijo % para LIKE
    },
    campos: ["id", "nombre", "puntos"],
    joins: { "<perfiles": "usuarios.id = perfiles.id_usuario" },
    order: "id DESC",
    limit: 10
});
```

#### Operadores Avanzados en `where`:
* **Sufijos de comparaci?n**: `campo%` (LIKE), `campo!` (!=), `campo>` (>), `campo<` (<), `campo>=` (>=), `campo<=` (<=).
* **Prefijos l?gicos**: `||campo` (OR), `&&campo` (AND por defecto).

#### B?squedas por ID y B?squeda Inteligente:
```javascript
// B?squeda directa por clave primaria:
const user = await usuarios.selectById(1);

// B?squeda inteligente (LIKE en varias columnas):
const encontrados = await usuarios.busqueda("Antigravity", ["nombre"]);
```

<details>
<summary><b>Sintaxis Posicional Alternativa (Legacy)</b></summary>

Tambi?n puedes usar la firma posicional cl?sica `select([campos], [joins], [where], ...)`:
```javascript
// Filtro directo string:
const mayores = await usuarios.select("puntos > 10");

// Selecci?n de columnas espec?ficas:
const nombres = await usuarios.select(["nombre"], "puntos < 50");
```

> [!WARNING]
> Si deseas filtrar usando un **objeto** en la sintaxis posicional sin definir campos ni joins, debes pasar `null` expl?citamente:
> ```javascript
> // Correcto posicional: (campos, joins, where)
> await usuarios.select(null, null, { "activo": 1 });
> ```
> *(Por esta raz?n se recomienda usar siempre la Sintaxis de Objeto ?nico)*.
</details>

### Actualización y Borrado
```javascript
// Actualización masiva o filtrada con cláusula string
await usuarios.update({ puntos: 200 }, "id = 1");

// Actualización por ID (más directo)
await usuarios.updateById({ puntos: 300 }, 1);

// Borrado
await usuarios.delete("id = 5");

// Borrado por ID
await usuarios.deleteById(5);
```

## 💎 El Poder de Active Record (dbRow)

Las filas devueltas son objetos inteligentes que permiten sincronizar cambios fácilmente.

```javascript
const user = await usuarios.selectOne("id = 1");

if (user) {
    user.puntos += 10;
    await user.update(); // Genera y ejecuta el SQL UPDATE automáticamente
    
    // O si deseas eliminarlo
    // await user.delete();
}
```

---

## ⚡ Serialización
Si necesitas asegurar que las operaciones se ejecuten secuencialmente en el hilo de SQLite:

```javascript
db.serialize(() => {
    // Operaciones aquí
});
```

---

## 🧪 Pruebas
Para ejecutar los tests del proyecto:
```sh
$ npm test
```

## 📄 Licencia
Este proyecto está bajo la Licencia MIT.

[npm-image]: https://img.shields.io/npm/v/sqlite3-tab.svg
[npm-url]: https://npmjs.org/package/sqlite3-tab
[node-version-image]: https://img.shields.io/node/v/sqlite3-tab.svg
[node-version-url]: https://nodejs.org/en/download/
[downloads-image]: https://img.shields.io/npm/dm/sqlite3-tab.svg
[downloads-url]: https://npmjs.org/package/sqlite3-tab
