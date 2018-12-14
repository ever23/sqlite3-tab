const assert= require("assert")
const connect = require("../sqlite3-tab.js")

describe("Test de la clase sqlite3-tab",()=>
{
    it('verificacion de metodos',()=>
    {
        const sqlite= new connect(":memory:")
        assert.equal(typeof sqlite.tabla,"function")
        assert.equal(typeof sqlite.query,"function")
        assert.equal(typeof sqlite.connect,"function")
        assert.equal(typeof sqlite.__escapeString,"function")
        assert.equal(typeof sqlite.__keysInTable,"function")
        assert.equal(typeof sqlite.end,"function")
        sqlite.end()
    })
   
    it('metodo query',()=>
    {
        const sqlite= new connect(":memory:")
        return sqlite.query("create table `test1`(`id` int not null,`row1` text default 'ever',`row2` int not null,`row3` text null,primary key (`id`))")
            .then(ok=>
            {
                assert.equal(ok,undefined)
                sqlite.end()
            })
     
    })

    
})
