const model = require("tabla-model");
const { describe, it } = require('node:test');
const assert= require("assert")
const dbtabla = require("dbtabla")
const connect = require("../sqlite3-tab.js")
const sqlite3Ok = require("../lib/sqlite3Ok.js")
const sqlite3Result = require("../lib/sqlite3Result.js")
const { dbRow } = require("dbtabla")
const path = require("path")
function createAndInsert(callback)
{
    return (new Promise((resolve,reject)=>
    {
        const sqlite= new connect(":memory:")
        sqlite.query("create table `test1`(`id` int not null,`row1` text default 'ever',`row2` int not null,`row3` date null,primary key (`id`))")
            .then(ok=>
            {
                sqlite.query("INSERT INTO `test1` (`id`,`row1`,`row2`,`row3`) VALUES (1,'text',12,'text2');")
                        .then(ok=>callback(resolve,reject,sqlite)).catch(reject)
            }).catch(reject)
    }))
}
describe("Test de la clase sqlite3-tab :tabla",()=>
{
    it('obtencion del objeto dbtabla',()=>
    {
        const sqlite= new connect(":memory:")
        assert.ok(sqlite.tabla('test1') instanceof dbtabla,"debe retornar un objeto dbtabla")
        sqlite.end()

    })
    it('obtencion del objeto dbtabla async',()=>
    {


        return (new Promise( (resolve,rejec)=>
        {
            const sqlite= new connect(":memory:")
            sqlite.query("create table `test1`(`id` int not null,`row1` text default 'ever',`row2` int not null,`row3` text null,primary key (`id`))")
            sqlite.tabla('test1',(test1)=>
            {
                resolve(test1)
            },true)
        })).then(test1=>
        {
            assert.ok((test1 instanceof dbtabla),"debe retornar un objeto dbtabla")
        })
    })
    it('dbTabla:insert',()=>
    {
        const sqlite= new connect(":memory:")
        sqlite.connection.run("create table `test1`(`id` int not null,`row1` text default 'ever',`row2` int not null,`row3` text null,primary key (`id`))")
        let test1=sqlite.tabla('test1')
        return test1.insert(12,"text",12,"text2").then(ok=>
        {
            assert.ok(ok instanceof sqlite3Ok,"debe retornar un objeto sqlite3Ok")
            //assert.equal(ok.$sql,"INSERT INTO `test1` (`id`,`row1`,`row2`,`row3`) VALUES (12,'text',12,'text2');")
        })

    })
    it('dbTabla:select',()=>
    {
        return createAndInsert((resolve,reject,sqlite)=>
            {
                let test1=sqlite.tabla('test1')
                test1.select().then(resolve).catch(reject)
            }).then(data=>
            {
                assert.ok(data instanceof sqlite3Result,"debe retornar un objeto sqlite3Result")
                assert.equal(data.$sql,"SELECT `test1`.* FROM `test1`;")
                assert.equal(data.length,1)
                assert.ok(data[0] instanceof dbRow,"debe retornar un objeto dbRow")
                assert.equal(data[0].id,1)
                assert.equal(data[0].row1,"text")
                assert.equal(data[0].row2,12)
                assert.equal(data[0].row3,"text2")
            })
    })
    it('dbTabla:update',()=>
    {
        return createAndInsert(async(resolve,reject,sqlite)=>
            {
                let test1=sqlite.tabla('test1')
                let ok=await test1.update({row2:"hola"},{id:1})
                if(ok.error)
                    throw ok
                test1.selectById(1).then(resolve).catch(reject)
            }).then(data=>
            {
                assert.equal(data.row2,"hola")
                //assert.equal(data.$sql,"UPDATE `test1` SET `row2`='hola' WHERE `id`=1;")

            })
    })
    it('dbTabla:delete',()=>
    {
        return createAndInsert((resolve,reject,sqlite)=>
            {
                let test1=sqlite.tabla('test1')
                test1.delete({id:1}).then(resolve).catch(reject)
            }).then(data=>
            {
                assert.ok(data instanceof sqlite3Ok,"debe retornar un objeto sqlite3Result")
                assert.equal(data.$sql,"DELETE FROM `test1` WHERE `id`=1;")
            })
    })
    it('load model test3',()=>
    {
        return (new Promise((resolve,reject)=>
        {
            const sqlite= new connect(":memory:")
            sqlite.pathModels(path.dirname(__filename)+"/modelo")
            try{
                 sqlite.tabla('test3',resolve,true)
            }catch(e)
            {
                reject(e)
            }

        })).then(test3=>
        {
            return test3.select().then(d=>
            {
                assert.ok(test3 instanceof dbtabla,"debe retornar un objeto dbtabla")
            })

        })
    })
    it('load model test4',()=>
    {
        return (new Promise((resolve,reject)=>
        {
            const sqlite= new connect(":memory:")
            sqlite.pathModels(path.dirname(__filename)+"/modelo")
            try{
                 sqlite.tabla('test4',resolve,true)
            }catch(e)
            {
                reject(e)
            }
        })).then(test4=>
        {
            return test4.select().then(d=>
            {
                assert.ok(test4 instanceof dbtabla,"debe retornar un objeto dbtabla")
            })

        })
    })
    it('simulación de AUTO_INCREMENT usando modelos',()=>
    {
        return (new Promise(async(resolve,reject)=>
        {
            const sqlite= new connect(":memory:")
            sqlite.pathModels(path.dirname(__filename)+"/modelo")
            let test4=sqlite.tabla('test4')
            await test4.insert(null,"text",12,"text2")
            await test4.insert([null,"mas texto",13,"text2"])
            await test4.insert({una:"text3",row2:14,dos:"asdasdasdasd"})
            test4.select().then(resolve).catch(reject)
        })).then(ok=>
        {
            assert.ok(ok instanceof Array)
            assert.equal(ok.length,3)
            assert.equal(ok[0].id_key2,1)
            assert.equal(ok[1].id_key2,2)
            assert.equal(ok[2].id_key2,3)
        })

    })
    it('auto-migración incremental de columnas al inicializar la tabla', async () => {
        const sqlite = new connect(":memory:")
        // Creamos la tabla física con solo 2 columnas
        await sqlite.query("CREATE TABLE test_migracion (id INTEGER PRIMARY KEY, nombre TEXT);")
        await sqlite.query("INSERT INTO test_migracion (id, nombre) VALUES (1, 'Juan');")

        // Registramos un modelo que tiene 3 columnas (agrega 'telefono')
        const modeloMigracion = new model("test_migracion", [
            { name: "id", type: "integer", primary: true },
            { name: "nombre", type: "text" },
            { name: "telefono", type: "text" }
        ])
        sqlite.addModel(modeloMigracion)

        // Al instanciar la tabla con verify=true o en la primera consulta, se debe auto-migrar
        const tabla = await new Promise((resolve, reject) => {
            sqlite.tabla('test_migracion', resolve, true)
        })

        // Verificamos que 'telefono' fue agregado a las columnas reconocidas
        const colNames = tabla.columns.map(c => c.name)
        assert.ok(colNames.includes('telefono'), "la columna 'telefono' debe estar en los metadatos")

        // Insertamos un registro usando la nueva columna
        await tabla.insert({ id: 2, nombre: "Pedro", telefono: "555-1234" })

        // Seleccionamos y verificamos que SQLite guardó y retornó la nueva columna
        const resultados = await tabla.select()
        assert.equal(resultados.length, 2)
        assert.equal(resultados[1].nombre, "Pedro")
        assert.equal(resultados[1].telefono, "555-1234")
    })
    it('respeta la opción autoMigrate: false', async () => {
        const sqlite = new connect({ autoMigrate: false })
        await sqlite.query("CREATE TABLE test_no_migrar (id INTEGER PRIMARY KEY, nombre TEXT);")

        const modelo = new model("test_no_migrar", [
            { name: "id", type: "integer", primary: true },
            { name: "nombre", type: "text" },
            { name: "direccion", type: "text" }
        ])
        sqlite.addModel(modelo)

        const tabla = await new Promise((resolve) => {
            sqlite.tabla('test_no_migrar', resolve, true)
        })

        const colNames = tabla.columns.map(c => c.name)
        assert.ok(!colNames.includes('direccion'), "no debe haber migrado 'direccion' con autoMigrate: false")
    })
    it('no intenta agregar columnas que ya existen en la base de datos (evita duplicate column name)', async () => {
        const sqlite = new connect(":memory:")
        // Creamos la tabla con sintaxis compleja (IF NOT EXISTS, comillas dobles, saltos de línea)
        await sqlite.query(`CREATE TABLE IF NOT EXISTS "inscripciones" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "cedula" VARCHAR(20) NOT NULL,
            "periodo" VARCHAR(10) NOT NULL
        );`)
        await sqlite.query("INSERT INTO inscripciones (cedula, periodo) VALUES ('12345678', '2026-1');")

        // Registramos el modelo que tiene 'periodo' y además una columna verdaderamente nueva 'seccion'
        const modeloInscripciones = new model("inscripciones", [
            { name: "id", type: "integer", primary: true, autoincrement: true },
            { name: "cedula", type: "varchar", len: 20 },
            { name: "periodo", type: "varchar", len: 10 },
            { name: "seccion", type: "varchar", len: 5 }
        ])
        sqlite.addModel(modeloInscripciones)

        // Instanciamos la tabla: no debe arrojar 'duplicate column name: periodo'
        const tabla = await new Promise((resolve, reject) => {
            sqlite.tabla('inscripciones', (t, err) => {
                if (err) return reject(err);
                resolve(t);
            }, true)
        })

        const colNames = tabla.columns.map(c => c.name.toLowerCase())
        assert.ok(colNames.includes('periodo'), "debe incluir 'periodo'")
        assert.ok(colNames.includes('seccion'), "debe haber agregado 'seccion'")

        // Insertamos un nuevo registro con seccion y periodo
        await tabla.insert({ cedula: "87654321", periodo: "2026-1", seccion: "A" })
        const rows = await tabla.select()
        assert.equal(rows.length, 2)
        assert.equal(rows[0].periodo, "2026-1")
        assert.equal(rows[1].seccion, "A")
    })
})
