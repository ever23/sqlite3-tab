let NativeSqlite = null
try {
    NativeSqlite = require("node:sqlite").DatabaseSync
} catch {
    NativeSqlite = null
}

let Sqlite3Driver = null
function getSqlite3Driver() {
    if (Sqlite3Driver === null) {
        try {
            Sqlite3Driver = require("sqlite3").verbose()
        } catch {
            Sqlite3Driver = false
        }
    }
    return Sqlite3Driver || null
}

function sanitizeSqliteValue(val) {
    return val === undefined ? null : val
}

function normalizeQueryArgs(params) {
    if (!params || params.length === 0) return []
    if (params.length === 1) {
        const first = params[0]
        if (first === undefined || first === null) return []
        if (Array.isArray(first)) return first.map(sanitizeSqliteValue)
        if (typeof first === "object") {
            const sanitized = {}
            for (const key of Object.keys(first)) {
                sanitized[key] = sanitizeSqliteValue(first[key])
            }
            return Object.keys(sanitized).length === 0 ? [] : [sanitized]
        }
        return [sanitizeSqliteValue(first)]
    }
    return params.map(sanitizeSqliteValue)
}

function wrapDatabaseSync(db) {
    if (typeof db.run !== "function") {
        db.run = function (sql, ...params) {
            let callback = null
            if (typeof params[params.length - 1] === "function") {
                callback = params.pop()
            }
            try {
                const norm = normalizeQueryArgs(params)
                let info = { changes: 0, lastInsertRowid: 0 }
                const stmts = sql.split(";").map(s => s.trim()).filter(Boolean)
                if (norm.length === 0 && stmts.length > 1) {
                    db.exec(sql)
                } else {
                    info = db.prepare(sql).run(...norm)
                }
                const context = {
                    lastID: Number(info?.lastInsertRowid ?? 0),
                    changes: info?.changes ?? 0
                }
                if (callback) {
                    callback.call(context, null)
                }
                return context
            } catch (err) {
                if (callback) {
                    callback.call({ lastID: 0, changes: 0 }, err)
                } else {
                    throw err
                }
            }
        }
    }
    if (typeof db.all !== "function") {
        db.all = function (sql, ...params) {
            let callback = null
            if (typeof params[params.length - 1] === "function") {
                callback = params.pop()
            }
            try {
                const norm = normalizeQueryArgs(params)
                const rows = db.prepare(sql).all(...norm)
                if (callback) callback(null, rows)
                return rows
            } catch (err) {
                if (callback) callback(err)
                else throw err
            }
        }
    }
    if (typeof db.get !== "function") {
        db.get = function (sql, ...params) {
            let callback = null
            if (typeof params[params.length - 1] === "function") {
                callback = params.pop()
            }
            try {
                const norm = normalizeQueryArgs(params)
                const row = db.prepare(sql).get(...norm)
                if (callback) callback(null, row)
                return row
            } catch (err) {
                if (callback) callback(err)
                else throw err
            }
        }
    }
    if (typeof db.each !== "function") {
        db.each = function (sql, ...params) {
            let complete = null
            let callback = null
            if (typeof params[params.length - 1] === "function") {
                const fn1 = params.pop()
                if (typeof params[params.length - 1] === "function") {
                    callback = params.pop()
                    complete = fn1
                } else {
                    callback = fn1
                }
            }
            try {
                const norm = normalizeQueryArgs(params)
                const rows = db.prepare(sql).all(...norm)
                for (const r of rows) {
                    if (callback) callback(null, r)
                }
                if (complete) complete(null, rows.length)
                return rows.length
            } catch (err) {
                if (complete) complete(err)
                else if (callback) callback(err)
                else throw err
            }
        }
    }
    if (typeof db.serialize !== "function") {
        db.serialize = function (call) {
            if (typeof call === "function") call()
        }
    }
    if (typeof db.parallelize !== "function") {
        db.parallelize = function (call) {
            if (typeof call === "function") call()
        }
    }
    return db
}

const sqlite3Tabla = require("./lib/sqlite3Tabla")
const { SQLITE3_DB, connect } = sqlite3Tabla

/**
* sqlite3Tab
* interface de alto nivel para consultas sqlite3 compatible con node:sqlite y sqlite3
*/
class sqlite3Tab extends connect {
    /**
    * @param {string|object} params - configuración para sqlite3, ruta de base de datos o instancia Database/DatabaseSync
    */
    constructor(params) {
        const Sqlite3 = getSqlite3Driver()
        const isSqlite3Instance = Boolean(Sqlite3 && (params instanceof Sqlite3.Database))
        const isNativeInstance = Boolean(NativeSqlite && (params instanceof NativeSqlite))
        const isCustomDbInstance = typeof params === "object" && params !== null && (
            typeof params.prepare === "function" ||
            (typeof params.all === "function" && typeof params.run === "function")
        )

        if (isSqlite3Instance || isNativeInstance || isCustomDbInstance) {
            super({}, SQLITE3_DB)
            if (isSqlite3Instance) {
                this.connection = params
                this._isNative = false
            } else if (isNativeInstance) {
                this.connection = wrapDatabaseSync(params)
                this._isNative = true
            } else if (typeof params.prepare === "function" && typeof params.exec === "function") {
                // Instancia tipo DatabaseSync / better-sqlite3
                this.connection = wrapDatabaseSync(params)
                this._isNative = true
            } else {
                this.connection = params
                this._isNative = false
            }
        } else {
            let filename = ":memory:"
            let configObj = {}
            let driver = null

            if (typeof params === "string") {
                filename = params
            } else if (typeof params === "object" && params !== null) {
                configObj = params
                filename = params.filename || params.database || ":memory:"
                driver = params.driver
            }
            super(configObj, SQLITE3_DB)

            const wantSqlite3 = driver === "sqlite3"
            const wantNative = driver === "node:sqlite"

            if (!wantSqlite3 && NativeSqlite && (!driver || wantNative)) {
                const options = configObj.options || {}
                this.connection = wrapDatabaseSync(new NativeSqlite(filename, options))
                this._isNative = true
            } else {
                const sqlite3Lib = getSqlite3Driver()
                if (!sqlite3Lib) {
                    throw new Error(
                        "No se encontró ningún motor SQLite disponible. En Node.js < 22, instale 'sqlite3' (npm install sqlite3). En Node.js >= 22.5 se utiliza el motor nativo 'node:sqlite' de forma automática."
                    )
                }
                this.connection = new sqlite3Lib.Database(filename)
                this._isNative = false
            }
        }

        this._escapeChar = "`"
        this._information_schema = "select sqlite_master.* from sqlite_master where  name="
        this._transactionConn = null
    }

    /**
     * Motor actualmente en uso ('node:sqlite' o 'sqlite3')
     */
    get engine() {
        return this._isNative ? "node:sqlite" : "sqlite3"
    }

    serialize(call) {
        return this.connection.serialize(call)
    }

    parallelize(call) {
        return this.connection.parallelize(call)
    }

    /**
    * construye un objeto dbtabla asociado al nombre de la tabla
    * @param {string} tabla - nombre de la tabla en la base de datos
    * @param {function} callback - función opcional que se ejecutará al verificar la tabla
    * @param {boolean} verify - si debe verificar la estructura en la base de datos
    * @return {dbTabla}
    */
    tabla(tabla, callback, verify = false) {
        if (typeof callback === "boolean") {
            verify = callback
        }
        if (typeof this._caheTablas[tabla] !== "undefined") {
            if (typeof callback === "function") callback(this._caheTablas[tabla])
            return this._caheTablas[tabla]
        }
        return this._caheTablas[tabla] = new sqlite3Tabla({
            tabla: tabla,
            connection: this,
            callback: t => (typeof callback === "function" ? callback(t) : null),
            config: this.helpersConf()
        }, verify)
    }

    /**
    * conecta con la base de datos (compatibilidad)
    */
    connect() {
        // En SQLite la conexión se establece en la instanciación
    }

    /**
    * envía una consulta a la base de datos
    * @param {string} query - consulta sql
    * @param {...any} params - parámetros posicionales o arreglo/objeto
    * @return {Promise<any>}
    */
    query(query, ...params) {
        return this._executeWithTiming(query, () => {
            return new Promise((resolver, reject) => {
                if (this._isNative) {
                    try {
                        const norm = normalizeQueryArgs(params)
                        if (/^[\s]*(select|pragma)/i.test(query)) {
                            const stmt = this.connection.prepare(query)
                            const rows = stmt.all(...norm)
                            return resolver(rows)
                        } else {
                            let info = { changes: 0, lastInsertRowid: 0 }
                            const stmts = query.split(";").map(s => s.trim()).filter(Boolean)
                            if (norm.length === 0 && stmts.length > 1) {
                                this.connection.exec(query)
                            } else {
                                const stmt = this.connection.prepare(query)
                                info = stmt.run(...norm)
                            }
                            return resolver({
                                insertId: Number(info.lastInsertRowid ?? 0),
                                lastID: Number(info.lastInsertRowid ?? 0),
                                changes: info.changes ?? 0,
                                affectedRows: info.changes ?? 0
                            })
                        }
                    } catch (err) {
                        return reject(err)
                    }
                }

                if (/^[\s]*(select|pragma)/i.test(query)) {
                    this.connection.all(query, ...params, (error, result) => {
                        if (error) {
                            return reject(error)
                        }
                        resolver(result)
                    })
                } else {
                    this.connection.run(query, ...params, function (error) {
                        if (error) {
                            return reject(error)
                        }
                        resolver({
                            insertId: this.lastID,
                            lastID: this.lastID,
                            changes: this.changes,
                            affectedRows: this.changes
                        })
                    })
                }
            })
        })
    }

    /**
    * envía una sentencia BEGIN TRANSACTION a la base de datos
    * @return {Promise}
    */
    async beginTransaction() {
        return this.query("BEGIN TRANSACTION")
    }

    /**
    * envía una sentencia COMMIT a la base de datos
    * @return {Promise}
    */
    async commit() {
        return this.query("COMMIT")
    }

    /**
    * envía una sentencia ROLLBACK a la base de datos
    * @return {Promise}
    */
    async rollback() {
        return this.query("ROLLBACK")
    }

    async _acquireDedicatedConnection() {
        return this.connection
    }

    async _releaseDedicatedConnection() {
        // En SQLite se utiliza la misma conexión serializada
    }

    _queryOnConnection(conn, query, ...params) {
        return this.query(query, ...params)
    }

    _getOnConnection(conn, query, param = {}) {
        return this.get(query, param)
    }

    /**
    * envía una consulta a la base de datos y obtiene una fila
    * @param {string} query - consulta sql
    * @param {...any} params - parámetros
    * @return {Promise}
    */
    get(query, ...params) {
        return this._executeWithTiming(query, () => {
            return new Promise((resolver, reject) => {
                if (this._isNative) {
                    try {
                        const norm = normalizeQueryArgs(params)
                        const stmt = this.connection.prepare(query)
                        const row = stmt.get(...norm)
                        return resolver(row || undefined)
                    } catch (err) {
                        return reject(err)
                    }
                }

                const p = params.length === 1 ? params[0] : (params.length === 0 ? {} : params)
                this.connection.get(query, p, (error, result) => {
                    if (error) {
                        return reject(error)
                    }
                    resolver(result)
                })
            })
        })
    }

    /**
    * envía una consulta a la base de datos e itera cada fila
    * @param {string} query - consulta sql
    * @param {any} param - parámetros opcionales
    * @param {function} callback - callback por cada fila
    * @return {Promise}
    */
    each(query, param = {}, callback) {
        return new Promise((resolver, reject) => {
            if (typeof param === "function") {
                callback = param
                param = {}
            }

            if (this._isNative) {
                try {
                    const norm = normalizeQueryArgs([param])
                    const rows = this.connection.prepare(query).all(...norm)
                    for (const r of rows) {
                        if (typeof callback === "function") {
                            callback(r)
                        }
                    }
                    return resolver(rows.length)
                } catch (err) {
                    return reject(err)
                }
            }

            this.connection.each(query, param, (error, result) => {
                if (error) {
                    return reject(error)
                }
                callback(result)
            }, resolver)
        })
    }

    /**
    * termina la conexión
    */
    end() {
        this.close()
    }

    /**
    * termina la conexión
    */
    close() {
        if (typeof this.connection?.close === "function") {
            return this.connection.close()
        }
    }

    /**
    * verifica la existencia y columnas de la tabla en la base de datos
    * @param {string} table - nombre de la tabla
    */
    async _keysInTable(table) {
        const rows = await this.query(`PRAGMA table_info('${table}')`)
        if (!rows || rows.length === 0) {
            try {
                return await this.inModel(table, true)
            } catch (e) {
                if (e === undefined) {
                    throw "la tabla no existe"
                }
                throw e
            }
        }
        const colums = rows.map(r => ({
            name: r.name,
            type: (r.type || "text").toLowerCase(),
            defaultNull: r.notnull === 0,
            primary: r.pk > 0,
            autoincrement: r.pk > 0 && /int/i.test(r.type || ""),
            unique: false,
            defaul: r.dflt_value !== null && r.dflt_value !== undefined ? String(r.dflt_value) : ""
        }))
        return {
            tabla: table,
            colums: colums,
            columns: colums,
            colum: colums
        }
    }
}

module.exports = sqlite3Tab
