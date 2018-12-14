const dbTabla=require("dbtabla")
const sqlite3Result=require("./sqlite3Result")
const sqlite3Ok=require("./sqlite3Ok")
/**
* sqlite3Tabla
* representacion de una tabla en sqlite3
*/
class sqlite3Tabla extends dbTabla
{
    /**
    * construlle el objeto de resultado para consultas select
    * @param {array} resultado obtenido de la consulta ejecutada
    * @return {sqlite3Result}
    */
    __formatResult(result)
    {
        return new sqlite3Result(this,result)
    }
    /**
    * construlle el objeto de resultado en consultas insert, delete, update,
    * @param {object}
    * @return {sqlite3Ok}
    */
    __PropertyOk(ok)
    {
        return new sqlite3Ok(this,ok)
    }

}
module.exports=sqlite3Tabla
