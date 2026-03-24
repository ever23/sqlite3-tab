const { dbResult } = require("dbtabla")

/**
* sqlite3Result
* Maneja el resultado de una consulta select 
*/
class sqlite3Result extends dbResult
{
    /**
    * @param {dbTabla} dbTabla - objeto de la tabla que ejecuto la consulta
    * @param {array} data - resultado de la consulta  
    */
    constructor(dbTabla,result)
    {
        super(dbTabla,result)
    }
}
module.exports=sqlite3Result
