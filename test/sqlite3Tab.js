const { describe, it } = require("node:test")
const assert = require("assert")
const connect = require("../sqlite3-tab.js")

describe("Test de la clase sqlite3-tab", () => {
    it("verificacion de metodos", () => {
        const sqlite = new connect(":memory:")
        assert.equal(typeof sqlite.tabla, "function")
        assert.equal(typeof sqlite.query, "function")
        assert.equal(typeof sqlite.connect, "function")
        assert.equal(typeof sqlite._keysInTable, "function")
        assert.equal(typeof sqlite.end, "function")
        assert.equal(sqlite.engine, "node:sqlite")
        sqlite.end()
    })

    it("metodo query con node:sqlite por defecto", () => {
        const sqlite = new connect(":memory:")
        return sqlite.query("create table `test1`(`id` int not null,`row1` text default 'ever',`row2` int not null,`row3` text null,primary key (`id`))")
            .then(ok => {
                assert.ok(typeof ok === "object", "debe retornar un objeto con información de la ejecución")
                assert.equal(ok.changes, 0)
                sqlite.end()
            })
    })

    it("soporte explicito para driver sqlite3", async () => {
        const sqlite = new connect({ filename: ":memory:", driver: "sqlite3" })
        assert.equal(sqlite.engine, "sqlite3")
        await sqlite.query("create table `test_legacy`(`id` int primary key, `nombre` text)")
        const ins = await sqlite.query("insert into `test_legacy` values (1, 'antigravity')")
        assert.equal(ins.affectedRows, 1)
        const rows = await sqlite.query("select * from `test_legacy` where id = 1")
        assert.equal(rows.length, 1)
        assert.equal(rows[0].nombre, "antigravity")
        sqlite.end()
    })

    it("soporte inyectando instancia DatabaseSync directamente", async () => {
        const { DatabaseSync } = require("node:sqlite")
        const rawDb = new DatabaseSync(":memory:")
        const sqlite = new connect(rawDb)
        assert.equal(sqlite.engine, "node:sqlite")
        await sqlite.query("create table `test_injected`(`id` int primary key, `val` text)")
        await sqlite.query("insert into `test_injected` values (1, 'ok')")
        const row = await sqlite.get("select * from `test_injected` where id = 1")
        assert.equal(row.val, "ok")
        sqlite.end()
    })

    it("soporte inyectando instancia sqlite3.Database directamente", async () => {
        const sqlite3 = require("sqlite3").verbose()
        const rawDb = new sqlite3.Database(":memory:")
        const sqlite = new connect(rawDb)
        assert.equal(sqlite.engine, "sqlite3")
        await sqlite.query("create table `test_injected_legacy`(`id` int primary key, `val` text)")
        await sqlite.query("insert into `test_injected_legacy` values (1, 'legacy_ok')")
        const row = await sqlite.get("select * from `test_injected_legacy` where id = 1")
        assert.equal(row.val, "legacy_ok")
        sqlite.end()
    })
})
