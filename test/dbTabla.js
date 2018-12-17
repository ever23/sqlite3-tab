const assert= require("assert")
const dbtabla = require("dbtabla")
const connect = require("../sqlite3-tab.js")
const sqlite3Ok = require("../lib/sqlite3Ok.js")
const sqlite3Result = require("../lib/sqlite3Result.js")
const dbRow = require("dbtabla/lib/dbRow")
const path = require("path")
function createAndInsert(callback)
{
    return (new Promise((resolve,reject)=>
    {
        const sqlite= new connect(":memory:")
        sqlite.query("create table `test1`(`id` int not null,`row1` text default 'ever',`row2` int not null,`row3` text null,primary key (`id`))")
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
        return test1.insert(1,"text",12,"text2").then(ok=>
        {
            assert.ok(ok instanceof sqlite3Ok,"debe retornar un objeto sqlite3Ok")
            assert.equal(ok.$sql,"INSERT INTO `test1` (`id`,`row1`,`row2`,`row3`) VALUES (1,'text',12,'text2');")
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
        return createAndInsert((resolve,reject,sqlite)=>
            {
                let test1=sqlite.tabla('test1')
                test1.update({row2:"hola"},{id:1}).then(resolve).catch(reject)
            }).then(data=>
            {
                assert.ok(data instanceof sqlite3Ok,"debe retornar un objeto sqlite3Result")
                assert.equal(data.$sql,"UPDATE `test1` SET `row2`='hola' WHERE `id`=1;")

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
})
