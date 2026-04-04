# sqlite3-tab

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]

**sqlite3-tab** es el módulo final y listo para producción para interactuar con bases de datos SQLite3 en Node.js. A diferencia de las librerías de bajo nivel, este paquete consolida la potencia de **dbtabla** (la capa de abstracción de base de datos) y **tabla-model** (la definición de esquemas), ofreciendo al desarrollador una solución "todo en uno" para la gestión de datos.

## Tabla de contenidos

- [Instalación](#instalación)
- [Introducción](#introducción)
- [Uso](#uso)
- [Documentación del API](#documentación-del-api)

## Instalación

`sqlite3-tab` es el único paquete que necesitas instalar para empezar a trabajar con SQLite de forma profesional:

```sh
$ npm install sqlite3-tab
```

---

## Introducción

`sqlite3-tab` es la interfaz definitiva que oculta la complejidad técnica de los drivers nativos y las abstracciones subyacentes. Utiliza internamente un ecosistema robusto para que tú solo tengas que preocuparte por tus datos:

1.  **Capa de Datos Inteligente**: Gracias a las abstracciones de `dbtabla`, tus operaciones CRUD se vuelven fluidas y consistentes.
2.  **Manejo de Esquemas Automático**: Al integrar `tabla-model`, la creación y sincronización de tablas ocurre de forma transparente al iniciar la aplicación.
3.  **Simplicidad para el Usuario**: No necesitas configurar múltiples librerías; `sqlite3-tab` orquestará todo el flujo desde la conexión hasta la manipulación de filas.

### Beneficios clave:
*   **Ahorro de Tiempo**: Dejaste de escribir SQL manual para tareas comunes; usa objetos y arreglos.
*   **Robustez**: Manejo automático de tipos, valores nulos y claves foráneas.
*   **Escalabilidad**: Al ser parte del ecosistema `dbtabla`, si decides migrar a MySQL o PostgreSQL más adelante, la lógica de tu aplicación permanecerá casi idéntica.

---

## Uso

Para empezar, solo necesitas instanciar la conexión y definir tus tablas. `sqlite3-tab` se encargará de verificar el archivo SQLite y estructurarlo según tus necesidades.

[Más documentación sobre dbTabla..](https://github.com/ever23/dbtabla#dbtabla-1)

### Ejemplo de uso directo:
```js
const SQLite = require("sqlite3-tab");

// Conexión simple a un archivo local
let db = new SQLite("./mi_proyecto.db");

let tabla = db.tabla("registros");

// Inserción sin preocuparte por el esquema manual
tabla.insert({ titulo: "Nota 1", contenido: "Hola Mundo" })
    .then(res => console.log("Guardado:", res))
    .catch(err => console.error("Error:", err));
```

### El flujo recomendado (Model-Driven)
Define tus tablas como modelos independientes y deja que `sqlite3-tab` haga el trabajo pesado de inicialización.

```js
// ./model/producto.js
const Model = require("tabla-model");

module.exports = new Model("productos", {
    colums: [ // Nota: 'colums' es la sintaxis interna del sistema
        { name: "id", type: "integer", primary: true, autoincrement: true },
        { name: "nombre", type: "varchar(100)" },
        { name: "precio", type: "float" }
    ]
});
```

#### Aplicación Principal:
```js
const SQLite = require("sqlite3-tab");
const path = require("path");

const db = new SQLite("./base_de_datos.sqlite");

// Carga global: sqlite3-tab leerá tus archivos y creará las tablas automáticamente
db.pathModels(path.join(__dirname, "model"));

// Consultar tus datos como objetos interactivos
db.tabla("productos").select().then(items => {
    items.forEach(async (item) => {
        item.precio *= 1.10; // Aplicar aumento del 10% directamente sobre la fila
        await item.update(); // sqlite3-tab genera el SQL de actualización por ti
    });
});
```

---

## Documentación del API

### `sqlite3Tab#constructor(config)`
*   `config {object|string}`: Ruta del archivo, `:memory:`, o una instancia nativa de `sqlite3.Database`.

### `sqlite3Tab#tabla(tabla, [callback], [verify])`
Estructura y retorna un objeto `dbTabla` (abstracción de alto nivel).

### `sqlite3Tab#addModel(model)` / `sqlite3Tab#pathModels(path)`
Métodos para integrar esquemas de `tabla-model` de forma masiva o individual. Especialmente útil para la creación automática de tablas.

### `sqlite3Tab#query(sql)`
Ejecuta SQL directo para casos específicos donde la abstracción no sea suficiente.

[npm-image]: https://img.shields.io/npm/v/sqlite3-tab.svg
[npm-url]: https://npmjs.org/package/sqlite3-tab
[node-version-image]: https://img.shields.io/node/v/sqlite3-tab.svg
[node-version-url]: https://nodejs.org/en/download/
[downloads-image]: https://img.shields.io/npm/dm/sqlite3-tab.svg
[downloads-url]: https://npmjs.org/package/sqlite3-tab
