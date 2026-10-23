/**
* sqlite3Ok
* creara un objecto de respuesta positiva para insert update y delete 
*/
class sqlite3Ok
{
    /**
    * @param {dbTabla} dbtabla - objeto de la tabla que ejecuto la consulta
    * @param {object} ok - resultado de la ejecucion ({ insertId, changes, ... })
    */
    constructor(dbtabla, ok)
    {
        this.$sql = dbtabla._lastSql
        if (ok && typeof ok === "object") {
            this.insertId = ok.insertId
            this.lastID = ok.lastID
            this.changes = ok.changes
            this.affectedRows = ok.affectedRows
        }
    }
}
module.exports = sqlite3Ok
