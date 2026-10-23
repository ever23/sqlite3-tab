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
            assert.ok(ok.insertId > 0)
            assert.equal(ok.changes, 1)
        })

    })
    it('dbTabla:insert con autoincrement nativo retorna insertId correcto', async () => {
        const sqlite = new connect(":memory:")
        await sqlite.query("CREATE TABLE usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT);")
        const tabla = sqlite.tabla('usuarios')
        const r1 = await tabla.insert({ nombre: "Usuario 1" })
        assert.equal(r1.insertId, 1)
        assert.equal(r1.changes, 1)

        const r2 = await tabla.insert({ nombre: "Usuario 2" })
        assert.equal(r2.insertId, 2)
        assert.equal(r2.changes, 1)
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
    it('insertAll inserta multiples filas en una sola llamada y retorna affectedRows / changes', async () => {
        const sqlite = new connect(":memory:")
        await sqlite.query("CREATE TABLE usuarios_bulk (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, edad INT);")
        const tabla = sqlite.tabla('usuarios_bulk')

        const res = await tabla.insertAll([
            { nombre: "Carlos", edad: 25 },
            { nombre: "Ana", edad: 30 },
            { nombre: "Luis", edad: 22 }
        ])

        assert.ok(res.changes === 3 || res.affectedRows === 3, "debe haber afectado 3 filas")
        const rows = await tabla.select()
        assert.equal(rows.length, 3)
        assert.equal(rows[0].nombre, "Carlos")
        assert.equal(rows[1].nombre, "Ana")
        assert.equal(rows[2].nombre, "Luis")
    })
    it("db.transaction confirma operaciones al finalizar el bloque con éxito", async () => {
        const sqlite = new connect(":memory:")
        await sqlite.query("CREATE TABLE cuentas (id INTEGER PRIMARY KEY, titular TEXT, saldo INT);")

        const res = await sqlite.transaction(async (tx) => {
            const cuentas = tx.tabla("cuentas")
            await cuentas.insert({ id: 1, titular: "Persona A", saldo: 500 })
            await cuentas.insert({ id: 2, titular: "Persona B", saldo: 200 })
            return "transferencia_completada"
        })

        assert.equal(res, "transferencia_completada")
        const cuentasDb = sqlite.tabla("cuentas")
        const rows = await cuentasDb.select()
        assert.equal(rows.length, 2)
        assert.equal(rows[0].titular, "Persona A")
        assert.equal(rows[1].titular, "Persona B")
    })
    it("db.transaction revierte todas las operaciones si ocurre una excepción", async () => {
        const sqlite = new connect(":memory:")
        await sqlite.query("CREATE TABLE cuentas_fail (id INTEGER PRIMARY KEY, titular TEXT, saldo INT);")
        const cuentasDb = sqlite.tabla("cuentas_fail")
        await cuentasDb.insert({ id: 1, titular: "Saldo Inicial", saldo: 1000 })

        let errorLanzado = null
        try {
            await sqlite.transaction(async (tx) => {
                const cuentas = tx.tabla("cuentas_fail")
                await cuentas.insert({ id: 2, titular: "Operacion 1", saldo: 50 })
                await cuentas.insert({ id: 3, titular: "Operacion 2", saldo: 80 })
                throw new Error("Fallo de negocio inesperado")
            })
        } catch (err) {
            errorLanzado = err
        }

        assert.ok(errorLanzado)
        assert.equal(errorLanzado.message, "Fallo de negocio inesperado")

        const rows = await cuentasDb.select()
        assert.equal(rows.length, 1)
        assert.equal(rows[0].id, 1)
        assert.equal(rows[0].titular, "Saldo Inicial")
    })
    it("db.transaction soporta transacciones anidadas con SAVEPOINT (éxito anidado)", async () => {
        const sqlite = new connect(":memory:")
        await sqlite.query("CREATE TABLE auditoria (id INTEGER PRIMARY KEY, evento TEXT);")

        await sqlite.transaction(async (tx) => {
            const audit = tx.tabla("auditoria")
            await audit.insert({ id: 1, evento: "inicio_proceso" })

            await tx.transaction(async (nestedTx) => {
                const nestedAudit = nestedTx.tabla("auditoria")
                await nestedAudit.insert({ id: 2, evento: "subproceso_ok" })
            })

            await audit.insert({ id: 3, evento: "fin_proceso" })
        })

        const auditDb = sqlite.tabla("auditoria")
        const rows = await auditDb.select()
        assert.equal(rows.length, 3)
        assert.equal(rows[0].evento, "inicio_proceso")
        assert.equal(rows[1].evento, "subproceso_ok")
        assert.equal(rows[2].evento, "fin_proceso")
    })
    it("db.transaction revierte únicamente el SAVEPOINT al fallar transacción anidada", async () => {
        const sqlite = new connect(":memory:")
        await sqlite.query("CREATE TABLE pedidos (id INTEGER PRIMARY KEY, detalle TEXT);")

        await sqlite.transaction(async (tx) => {
            const pedidos = tx.tabla("pedidos")
            await pedidos.insert({ id: 1, detalle: "pedido principal" })

            try {
                await tx.transaction(async (nestedTx) => {
                    const nestedPedidos = nestedTx.tabla("pedidos")
                    await nestedPedidos.insert({ id: 2, detalle: "pedido secundario que fallara" })
                    throw new Error("Error en sub-pedido")
                })
            } catch (e) {
                // Ignorado
            }

            await pedidos.insert({ id: 3, detalle: "pedido de cierre" })
        })

        const pedidosDb = sqlite.tabla("pedidos")
        const rows = await pedidosDb.select()
        assert.equal(rows.length, 2)
        assert.equal(rows[0].id, 1)
        assert.equal(rows[0].detalle, "pedido principal")
        assert.equal(rows[1].id, 3)
        assert.equal(rows[1].detalle, "pedido de cierre")
    })
    it("dbTabla.paginate() paginación clásica por página sobre SQLite real", async () => {
        const sqlite = new connect(":memory:")
        await sqlite.query("CREATE TABLE articulos (id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, precio INT, categoria TEXT);")
        const tabla = sqlite.tabla("articulos")

        // Insertamos 25 artículos
        const items = []
        for (let i = 1; i <= 25; i++) {
            items.push({
                titulo: `Articulo ${i}`,
                precio: i * 10,
                categoria: i % 2 === 0 ? "tecnologia" : "hogar"
            })
        }
        await tabla.insertAll(items)

        // Página 1
        const p1 = await tabla.paginate({ page: 1, limit: 10, order: "id ASC" })
        assert.equal(p1.total, 25)
        assert.equal(p1.page, 1)
        assert.equal(p1.limit, 10)
        assert.equal(p1.totalPages, 3)
        assert.equal(p1.hasNext, true)
        assert.equal(p1.hasPrev, false)
        assert.equal(p1.data.length, 10)
        assert.equal(p1.data[0].id, 1)
        assert.equal(p1.data[9].id, 10)

        // Página 2
        const p2 = await tabla.paginate({ page: 2, limit: 10, order: "id ASC" })
        assert.equal(p2.page, 2)
        assert.equal(p2.hasNext, true)
        assert.equal(p2.hasPrev, true)
        assert.equal(p2.data.length, 10)
        assert.equal(p2.data[0].id, 11)
        assert.equal(p2.data[9].id, 20)

        // Página 3 (última página)
        const p3 = await tabla.paginate({ page: 3, limit: 10, order: "id ASC" })
        assert.equal(p3.page, 3)
        assert.equal(p3.hasNext, false)
        assert.equal(p3.hasPrev, true)
        assert.equal(p3.data.length, 5)
        assert.equal(p3.data[0].id, 21)
        assert.equal(p3.data[4].id, 25)

        // Con filtro where
        const pFiltrado = await tabla.paginate({
            where: { categoria: "tecnologia", "precio>=": 100 },
            page: 1,
            limit: 5
        })
        assert.ok(pFiltrado.total > 0)
        assert.ok(pFiltrado.data.every(row => row.categoria === "tecnologia" && row.precio >= 100))
    })
    it("dbTabla.paginate() paginación por cursor (Keyset) sobre SQLite real", async () => {
        const sqlite = new connect(":memory:")
        await sqlite.query("CREATE TABLE feeds (id INTEGER PRIMARY KEY, mensaje TEXT);")
        const tabla = sqlite.tabla("feeds")

        const items = []
        for (let i = 1; i <= 12; i++) {
            items.push({ id: i, mensaje: `Mensaje #${i}` })
        }
        await tabla.insertAll(items)

        // Primera tanda (cursor inicial sin after)
        const batch1 = await tabla.paginate({ limit: 5, order: "id ASC" })
        assert.equal(batch1.data.length, 5)
        assert.equal(batch1.hasMore, true)
        assert.equal(batch1.nextCursor, 5)
        assert.equal(batch1.data[0].id, 1)
        assert.equal(batch1.data[4].id, 5)

        // Segunda tanda (después de id 5)
        const batch2 = await tabla.paginate({ after: batch1.nextCursor, limit: 5, order: "id ASC" })
        assert.equal(batch2.data.length, 5)
        assert.equal(batch2.hasMore, true)
        assert.equal(batch2.nextCursor, 10)
        assert.equal(batch2.data[0].id, 6)
        assert.equal(batch2.data[4].id, 10)

        // Tercera tanda (después de id 10, solo quedan 2)
        const batch3 = await tabla.paginate({ after: batch2.nextCursor, limit: 5, order: "id ASC" })
        assert.equal(batch3.data.length, 2)
        assert.equal(batch3.hasMore, false)
        assert.equal(batch3.nextCursor, null)
        assert.equal(batch3.data[0].id, 11)
        assert.equal(batch3.data[1].id, 12)
    })
    it("db.on('query') emite eventos con sql, timeMs y estado de transacción sobre SQLite", async () => {
        const sqlite = new connect(":memory:")
        const events = []
        sqlite.on('query', (e) => events.push(e))

        await sqlite.query("CREATE TABLE logs_test (id INTEGER PRIMARY KEY, msg TEXT);")
        await sqlite.query("INSERT INTO logs_test (msg) VALUES ('hola mundo');")

        assert.equal(events.length, 2)
        assert.equal(events[0].sql, "CREATE TABLE logs_test (id INTEGER PRIMARY KEY, msg TEXT);")
        assert.ok(typeof events[0].timeMs === "number" && events[0].timeMs >= 0)
        assert.equal(events[0].isTransaction, false)
        assert.equal(events[0].error, null)

        await sqlite.transaction(async (tx) => {
            await tx.query("INSERT INTO logs_test (msg) VALUES ('transaccional');")
        })

        const txEvent = events.find(e => e.sql.includes("transaccional"))
        assert.ok(txEvent)
        assert.equal(txEvent.isTransaction, true)
    })
    it("db.onSlowQuery alerta cuando la consulta supera el umbral", async () => {
        const sqlite = new connect(":memory:")
        const slowList = []
        sqlite.onSlowQuery(0, (e) => slowList.push(e))

        await sqlite.query("SELECT 1;")
        assert.equal(slowList.length, 1)
        assert.equal(slowList[0].sql, "SELECT 1;")
        assert.ok(typeof slowList[0].timeMs === "number")
    })
})
