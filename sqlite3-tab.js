const sqlite3=require("sqlite3").verbose()
const sqlite3Tabla=require("./lib/sqlite3Tabla")
const {SQLITE3_DB,connect}= sqlite3Tabla
const model=require("tabla-model")
//console.log(sqlite3)
/**
* mysqlTable
* crea una conexion a una base de datos mysql
*/
class sqlite3Tab extends connect
{
    /**
    * @param {object} param - configuracion para sqlite3 o objeto Database de sqlite3
    *
    */
    constructor(params)
    {
        if(params instanceof sqlite3.Database)
        {
            super({},SQLITE3_DB)
            this.connection=params
        }else {
            super(params,SQLITE3_DB)
            this.connection=new sqlite3.Database(params)
        }
        this.__escapeChar="`"
        this.__information_schema = "select sqlite_master.* from sqlite_master where  name="
        sqlite3Tab.__caheTablas={}
    }
    serialize(call)
    {
        return this.connection.serialize(call)
    }
    parallelize(call)
    {
        return this.connectionparallelize(call)
    }
    /**
    * construlle un objeto dbtabla asociado a el nombre
    * de la tabla del primer parametro
    * @param {string} tabla - nombre de la tabla en la base de datos
    * @param {function} callback - funcion anomina que se ejecutara cuando se verifique la existencia de la tabla
    * @return {dbTabla}
    */
    tabla(tabla,callback,verify=false)
    {
        if(typeof callback ==="boolean")
            verify=callback
        if(typeof this.__caheTablas[tabla]!=="undefined")
        {
            typeof callback==="function"?callback(this.__caheTablas[tabla]):null
            return this.__caheTablas[tabla]
        }
        return  this.__caheTablas[tabla] = new sqlite3Tabla({
            tabla:tabla,
            connection:this,
            callback:t=>typeof callback==="function"?callback(t):null,
            config:this.helpersConf()
        },typeof callback==="function" && verify)

    }
    /**
    * connecta con la base de datos
    *
    */
    connect()
    {
        //this.connection.connect(callback)
    }
    /**
    * envia una consulta a la base de datos
    * @param {string} query - consulta sql
    * @return {Promise}
    */
    query(query,...params)
    {
        return new Promise((resolver,reject)=>
        {

            if(/^[\s]*select/i.test(query))
            {
                this.connection.all(query,...params,(error,result)=>
                {
                    if(error)
                    {
                        return reject(error)
                    }
                    resolver(result)
                })
            }else{
                this.connection.run(query,...params,(error,result)=>
                {
                    if(error)
                    {
                        return reject(error)
                    }
                    resolver(result)
                })
            }

        })
    }
    /**
    * envia una consulta a la base de datos y obtiene una fila
    * @param {string} query - consulta sql
    * @return {Promise}
    */
    get(query,param={})
    {
        return new Promise((resolver,reject)=>
        {
            this.connection.get(query,param,(error,result)=>
            {
                if(error)
                {
                    return reject(error)
                }
                resolver(result)
            })
        })
    }
    /**
    * envia una consulta a la base de datos y obtiene una fila
    * @param {string} query - consulta sql
    * @return {Promise}
    */
    each(query,param={},callback)
    {
        return new Promise((resolver,reject)=>
        {
            if(typeof param==="function")
            {
                callback=param
                param={}
            }
            this.connection.each(query,param,(error,result)=>
            {
                if(error)
                {
                    return reject(error)
                }
                callback(result)
            },resolver)
        })
    }


    /**
    * termina la conexion
    */
    end()
    {
        this.connection.close()
    }
    /**
    * termina la conexion
    */
    close()
    {
        this.connection.close()
    }
    /**
    * verificara la existencia de la tabla
    * en la base de datos y retorna una promesa
    * el segundo parametro
    * @param {string} table - nombre de la tabla
    */
    __keysInTable(table)
    {
        return new Promise((res,rej)=>
        {
            this.query(`${this.__information_schema}'${table}'`)
                .then(result=>{
                    this.inModel(table,result.length==0)
                        .then(res).catch(e=>
                        {
                            if(e===undefined)
                            {
                                if(result.length==0)
                                    rej("la tabla no existe")
                                else
                                    res((new model(result[0].sql,this.__escapeChar)).getData())
                            }else
                            {
                                rej(e)
                            }
                        })
                }).catch(rej)
        })

    }

}

module.exports=sqlite3Tab
