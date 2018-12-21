const dbTabla=require("dbtabla")
const sqlite3Result=require("./sqlite3Result")
const sqlite3Ok=require("./sqlite3Ok")
const dbTablaError=require("dbTabla/lib/dbTablaError")
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
    * @param {array|object|string} ...params - campos a insertar
    * @retuen {Promise}
    */
    insert(...params)
    {
        if(params.length===0)
        {
            throw new dbTablaError("debe pasar almenos un parametro")
        }
        return new Promise((res,rej)=>
        {
            this.__verifyKeys(e=> 
            {
                if(e)
                {
                    return rej(e)
                }
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
                            this.__insert(params).then(d=>{
                                this.sql.nextAutoincrementValue=undefined
                                res(this.__PropertyOk(d))
                            }).catch(e=>
                            {
                                this.sql.nextAutoincrementValue=undefined
                                rej(e)
                            })
                        }).catch(rej)
                }else
                {
                    this.__insert(params).then(d=>res(this.__PropertyOk(d))).catch(e=>rej(e))
                }
            })
        })
    }
    __insert(params)
    {
        this.sql.activeSmt(true)
        if(params instanceof Array && params.length==1)
        {
            this.__lastSql=this.sql.insert(params[0])
        }else{
            this.__lastSql=this.sql.insert(params)
        }
        let data = this.sql.getDataSmt()
        this.sql.resetDataSmt()
        this.sql.activeSmt(false)
        return this.__connection.query(this.__lastSql,data)
    }
    /**
    * envia una sentencia update en la base de datos
    * @param {object} sets - elementos a modificar
    * @param {string|object} where - exprecion booleana sql
    * @return {Promise}
    */
    update(sets,where)
    {
        if(sets===undefined )
        {
            throw new dbTablaError("Falta el parametro numero 1 sets no es opcional")
        }else if(typeof sets!=="object")
        {
            throw new dbTablaError("El parametro numero 1 sets debe ser un de tipo object")
        }
        if(where===undefined)
        {
            throw new dbTablaError("Falta el parametro numero 2 where no es opcional")
        }
        return new Promise((resolve,reject)=>
        {
            this.__verifyKeys(e=>
            {
                if(e)
                {
                    return reject(e)
                }
                this.sql.activeSmt(true)
                this.__lastSql =this.sql.update(sets,where,reject)
                let data = this.sql.getDataSmt()
                this.sql.resetDataSmt()
                this.sql.activeSmt(false)
                if(this.__lastSql)
                {
                    this.__connection.query(this.__lastSql,data).then(d=>{
                        resolve(this.__PropertyOk(d))
                    }).catch(e=>reject(e))
                }
            })
        })
    }
}
module.exports=sqlite3Tabla
