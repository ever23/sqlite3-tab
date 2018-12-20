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
        let retOk=new sqlite3Ok(this,ok)
        if(this.sql.nextAutoincrementValue!==undefined)
        {
            retOk.insertId=this.sql.nextAutoincrementValue
        }
        return retOk
    }
    /**
    * envia una sentencia insert a la base de datos
    * @param {array|object|string} ...campos - campos a insertar
    * @retuen {Promise}
    */
    insert(...params)
    {
        return new Promise((res,rej)=>
        {
            this.__verifyKeys(()=>
            {
                let index=this.sql.colums.findIndex(d=>d.autoincrement)
                if(this.sql.autoincrement!==undefined && 
                (
                    (params.length==1 && typeof params[0]==="object" && (params[0][this.sql.autoincremet]===null||params[0][this.sql.autoincremet]===undefined))||
                    (params.length>1 && index!==-1 && (params[index]===null||params[index]===undefined))  
                ))
                {
                    this.__connection.get(`SELECT max(${this.sql.autoincrement}) as autoincrement_value FROM ${this.tabla}`)
                        .then(row=>
                        {
                            this.sql.nextAutoincrementValue=Number(row.autoincrement_value)+1
                            super.insert(...params).then(d=>{
                                this.sql.nextAutoincrementValue=undefined
                                res(d)
                            }).catch(e=>
                            {
                                this.sql.nextAutoincrementValue=undefined
                                rej(e)
                            })
                        }).catch(rej)
                }else
                {
                    super.insert(...params).then(res).catch(rej)
                }
            })
        })
    }
}
module.exports=sqlite3Tabla
