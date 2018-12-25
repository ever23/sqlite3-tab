# sqlite3-tab 

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Node.js Version][node-version-image]][node-version-url]

## Tabla de contenidos

- [Install](#install)
- [Introduccion](#introduccion)
- [Uso](#uso)

## install

sqlite3-tab es un  modulo de [Node.js](https://nodejs.org/es/) valido registrado en [npm registry](https://www.npmjs.com/).

Para instalar use [`npm install` command](https://docs.npmjs.com/getting-started/installing-npm-packages-locally):

```sh
$ npm install sqlite3-tab
```
## introduccion

sqlite3-tab es una interface de alto nivel para generar consultas en sqlite3
Escrito en JavaScript


## uso

Para usar este modulo solo es nesesario conocer un poco el api de sqlite3 los parametros del constructor de sqlite3Tab son los mismos que se usarian
en la funcion Database de sqlite3, usando el metodo *`tabla(tabla)`* se obtiene
un objeto dbTabla que representa a la tabla con el nombre del parametro en la base de datos.

[Mas documentacion sobre dbTabla..](https://github.com/ever23/dbtabla#dbtabla-1)
```js
// file ./index.js
const sqlite=require("sqlite3-tab")
let connect= new sqlite(":memory:")
let test1=connect.tabla("test1")
// insert([1,"un texto","otro texto"]) tabien se acepta un objeto  
test1.insert(1,"un texto","otro texto")
    .then(ok=>
    {
        console.log(ok)
    }).catch(e=>
    {
        console.log(e)
    })
```
En este caso si la tabla test1 no existe lanzara un error en catch
para resolver esto podemos crear un modelo para
la tabla test1 y cargarlo esto ara que se verifique la existencia y
si no existe la tabla sea creada e inicializada automaticamente para esto
podemos crear un directorio que contendra los modelos por ejemplo ./model/
y crear los modelos nesesarios para el proyecto usando el modulo tabla-model
```js
// file ./model/test1.js
const model=require("tabla-model")
const test2=new model("test2",[
    {
        name:"id",
        type:"int",
        primary:true,
        autoincrement:true// simula el AUTO_INCREMENT de mysql
    },
    {
        name:"row1",
        type:"text"
    },
    {
        name:"row2",
        type:"int",
    },
    {
        name:"row3",
        type:"date",
    }
])
test2.foreingKey({ // se agrega las claves foraneas
    key:"row2",
    reference:"test4",
    keyReference:"id_key2",
    onUpdate:'CASCADE',
    onDelete:'NO ACTION',
    // match: ' '
})
test2.insert(null,"hola",14,"2018/10/23")// datos de inicializacion
// el parametro tabla recibira el objeto de la tabla
// y el segundo el objeto de conexion
// y el resto los parametros pasados en la llamada
test2.method("miMetodo",(tabla,connect,...params)=>
{
    //tu codigo para el metodo del modelo
    //tabla.select()
    //tabla.insert()
    //tabla.update()
    //tabla.delete()
})
module.exports=test2
```
Luego en para usarlo
```js
// file ./index.js
const sqlite=require("sqlite3-tab")
const path=require("path")

let connect= new sqlite(":memory:")

connect.pathModels(path.dirname(__filename)+"/model")

let test2=connect.tabla("test2")
// insert([1,"un texto","otro texto"]) tabien se acepta un objeto  
test2.insert(1,"un texto","otro texto")
    .then(ok=>
    {
        console.log(ok)
    }).catch(e=>
    {
        console.log(e)
    })
test2.miMetodo("hola")
```
[Mas documentacion sobre tabla-model..](https://github.com/ever23/tabla-model#uso)

## sqlite3Tab#constructor(config)

Constructor de sqlite3Tab

* `config {object|string}`: configuracion para sqlite3, tambien se puede pasar un objeto obtenido de la funcion Database de sqlite3
```js
const sqlite=require("sqlite3-tab")
let connect= new sqlite(":memory:")
```
```js
const sqliteTab=require("sqlite3-tab")
const sqlite3=require("sqlite3")
let db = new sqlite3.verbose().Database(":memory:")
let connect= new sqliteTab(db)
```

## sqlite3Tab#tabla(tabla,[callback,[verify]])
Factoriza y retorna un objeto dbTabla que representara a la tabla con el nombre del primer parametro

* `tabla {string}`: Nombre de la tabla en la base de metadatos
* `callback {function} (opcional)`: Funcion que sera ejecutada cuando se verifique la existencia de la tabla, esta funcion recibira un parametro que sera el objeto dbTabla creado y si la tabla no es encontrada el parametro sera *null*
* `verify {boolean} (opcional)`: indica  si la verificacion se realizara al instante o se esperara a la primera consulta

## sqlite3Tab#model(tabla)
Verifica si un modelo existe y lo retorna si no existe retorna *`false`*

* `tabla {string}`: Nombre del modelo

## sqlite3Tab#addModel(model)
Agrega un modelo
* `model {sqlModel|object|string}`: Si es un objeto instanceado de tabla-model se agregara a la lista de modelos, si es un objeto pero no de tabla-model se tomara como los datos para factorizar un modelo deberia tener el formato *`{tabla:String, campos:Array, foreingKey:Array}`* y su es un string deberia ser una clausula sql CREATE TABLE de la cual se factorizara el modelo
```js
//ejemplo 1
const sqlite=require("sqlite3-tab")
const model=require("tabla-model")
let connect= new sqlite(":memory:")
const test2=new model("test2",{
    campos:[
        {
            name:"id",
            type:"int",
            primary:true,

        },
        {
            name:"row1",
            type:"text"
        },
        {
            name:"row2",
            type:"int",
        },
        {
            name:"row3",
            type:"date",
        }
    ]
})
 connect.addModel(test2)
```
```js
//ejemplo 2
const sqlite=require("sqlite3-tab")
let connect= new sqlite(":memory:")
connect.addModel({
    tabla:"test2",
    campos:[
        {
            name:"id",
            type:"int",
            primary:true,
        },
        {
            name:"row1",
            type:"text"
        },
        {
            name:"row2",
            type:"int",
        },
        {
            name:"row3",
            type:"date",
        }
    ]
})
```
```js
//ejemplo 3
const sqlite=require("sqlite3-tab")
let connect= new sqlite(":memory:")
connect.addModel(`CREATE TABLE test2 (
    id int,
    row1 text,
    row2 int,
    row3 date,
    primary key (id)
)`)
```

## sqlite3Tab#pathModels(path)
Cargar todos los modelos existentes en el directorio path  
* `path {string}`: directorio de modelos


## sqlite3Tab#query(sql,[config])

Ejecuta una consulta sql en la base de datos y retorna una promesa

* `sql {string}`: consulta sql
* `config {object}`: configuracion para la consulta sqlite3

## sqlite3Tab#close()

Cierra la base de datos sqlite3

[npm-image]: https://img.shields.io/npm/v/sqlite3-tab.svg
[npm-url]: https://npmjs.org/package/sqlite3-tab
[node-version-image]: https://img.shields.io/node/v/sqlite3-tab.svg
[node-version-url]: https://nodejs.org/en/download/
[coveralls-url]: https://coveralls.io/r/mysqljs/sqlite3-tab?branch=master
[downloads-image]: https://img.shields.io/npm/dm/sqlite3-tab.svg
[downloads-url]: https://npmjs.org/package/sqlite3-tab
