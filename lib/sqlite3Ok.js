/**
* sqlite3Ok
* creara un objecto de respuesta positiva para insert update y delete 
*/
class sqlite3Ok
{
    /**
    * @param {dbTabla} objeto de la tabla que ejecuto la consulta
    *
    */
    constructor(dbtabla)
    {
        this.$sql=dbtabla._lastSql
    }
}
module.exports=sqlite3Ok