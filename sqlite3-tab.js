const sqlite3 = require("sqlite3").verbose()
const sqlite3Tabla = require("./lib/sqlite3Tabla")
const { SQLITE3_DB, connect } = sqlite3Tabla
const model = require("tabla-model")
//console.log(sqlite3)
/**
* mysqlTable
* crea una conexion a una base de datos mysql
*/
class sqlite3Tab extends connect {
    /**
    * @param {object} param - configuracion para sqlite3 o objeto Database de sqlite3
    *
    */
    constructor(params) {
        if (params instanceof sqlite3.Database) {
            super({}, SQLITE3_DB)
            this.connection = params
        } else if (typeof params === 'object' && params !== null) {
            super(params, SQLITE3_DB)
            this.connection = new sqlite3.Database(params.filename || params.database || ':memory:')
        } else {
            super(params, SQLITE3_DB)
            this.connection = new sqlite3.Database(params)
        }
        this._escapeChar = "`"
        this._information_schema = "select sqlite_master.* from sqlite_master where  name="
        this._transactionConn = null
    }
    serialize(call) {
        return this.connection.serialize(call)
    }
    parallelize(call) {
        return this.connection.parallelize(call)
    }
    /**
    * construlle un objeto dbtabla asociado a el nombre
    * de la tabla del primer parametro
    * @param {string} tabla - nombre de la tabla en la base de datos
    * @param {function} callback - funcion anomina que se ejecutara cuando se verifique la existencia de la tabla
    * @return {dbTabla}
    */
    tabla(tabla, callback, verify = false) {
        if (typeof callback === "boolean")
            verify = callback
        if (typeof this._caheTablas[tabla] !== "undefined") {
            typeof callback === "function" ? callback(this._caheTablas[tabla]) : null
            return this._caheTablas[tabla]
        }
        return this._caheTablas[tabla] = new sqlite3Tabla({
            tabla: tabla,
            connection: this,
            callback: t => typeof callback === "function" ? callback(t) : null,
            config: this.helpersConf()
        }, verify)

    }
    /**
    * connecta con la base de datos
    *
    */
    connect() {
        //this.connection.connect(callback)
    }
    /**
    * envia una consulta a la base de datos
    * @param {string} query - consulta sql
    * @return {Promise}
    */
    query(query, ...params) {
        return this._executeWithTiming(query, () => {
            return new Promise((resolver, reject) => {
                if (/^[\s]*(select|pragma)/i.test(query)) {
                    this.connection.all(query, ...params, (error, result) => {
                        if (error) {
                            return reject(error);
                        }
                        resolver(result);
                    });
                } else {
                    this.connection.run(query, ...params, function (error) {
                        if (error) {
                            return reject(error);
                        }
                        resolver({
                            insertId: this.lastID,
                            lastID: this.lastID,
                            changes: this.changes,
                            affectedRows: this.changes
                        });
                    });
                }
            });
        });
    }
    /**
    * envia una sentencia BEGIN TRANSACTION a la base de datos
    *
    * @return {Promise}
    */
    async beginTransaction() {
        return this.query("BEGIN TRANSACTION");
    }

    /**
    * envia una sentencia commit a la base de datos
    *
    * @return {Promise}
    */
    async commit() {
        return this.query("COMMIT");
    }

    /**
    * envia una sentencia rollback a la base de datos
    *
    * @return {Promise}
    */
    async rollback() {
        return this.query("ROLLBACK");
    }

    async _acquireDedicatedConnection() {
        return this.connection;
    }

    async _releaseDedicatedConnection(conn) {
        // En SQLite se utiliza la misma conexión serializada
    }

    _queryOnConnection(conn, query, ...params) {
        return this.query(query, ...params);
    }

    _getOnConnection(conn, query, param = {}) {
        return this.get(query, param);
    }
    /**
    * envia una consulta a la base de datos y obtiene una fila
    * @param {string} query - consulta sql
    * @return {Promise}
    */
    get(query, param = {}) {
        return this._executeWithTiming(query, () => {
            return new Promise((resolver, reject) => {
                this.connection.get(query, param, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolver(result);
                });
            });
        });
    }
    /**
    * envia una consulta a la base de datos y obtiene una fila
    * @param {string} query - consulta sql
    * @return {Promise}
    */
    each(query, param = {}, callback) {
        return new Promise((resolver, reject) => {
            if (typeof param === "function") {
                callback = param
                param = {}
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
    * termina la conexion
    */
    end() {
        this.connection.close()
    }
    /**
    * termina la conexion
    */
    close() {
        this.connection.close()
    }
    /**
    * verificara la existencia de la tabla
    * en la base de datos y retorna una promesa
    * el segundo parametro
    * @param {string} table - nombre de la tabla
    */
    _keysInTable(table) {
        return new Promise(async (res, rej) => {
            try {
                const rows = await this.query(`PRAGMA table_info('${table}')`);
                if (!rows || rows.length === 0) {
                    this.inModel(table, true)
                        .then(res).catch(e => {
                            if (e === undefined) {
                                rej("la tabla no existe");
                            } else {
                                rej(e);
                            }
                        });
                } else {
                    const colums = rows.map(r => ({
                        name: r.name,
                        type: (r.type || 'text').toLowerCase(),
                        defaultNull: r.notnull === 0,
                        primary: r.pk > 0,
                        unique: false,
                        defaul: r.dflt_value !== null && r.dflt_value !== undefined ? String(r.dflt_value) : ""
                    }));
                    res({
                        tabla: table,
                        colums: colums,
                        columns: colums,
                        colum: colums
                    });
                }
            } catch (err) {
                rej(err);
            }
        });
    }

}

module.exports = sqlite3Tab
