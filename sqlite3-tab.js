const sqlite3=require("sqlite3").verbose()
const sqlite3Tabla=require("./lib/sqlite3Tabla")
const {SQLITE3_DB,connect}= sqlite3Tabla
const model=require("sql-model")
//console.log(sqlite3)
/**
* mysqlTable
* crea una coneccion a una base de datos mysql
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
            create=callback
        if(typeof sqlite3Tab.__caheTablas[tabla]!=="undefined")
        {
            return sqlite3Tab.__caheTablas[tabla]
        }
        return  sqlite3Tab.__caheTablas[tabla] = new sqlite3Tabla({
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
    query(query,option={})
    {
        return new Promise((resolver,reject)=>
        {

            if(/^[\s]*select/i.test(query))
            {

                this.connection.all(query,option,(error,result)=>
                {
                    if(error)
                    {
                        return reject(error)
                    }
                    resolver(result)
                })
            }else{
                this.connection.run(query,option,(error,result)=>
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
                calback=param
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
    * termina la coneccion
    */
    end()
    {
        this.connection.close()
    }
    /**
    * termina la coneccion
    */
    close()
    {
        this.connection.close()
    }
    /**
    * verificara la existencia de la tabla
    * en la base de datos y pasa lo metadatos de la misma calback en
    * el segundo parametro
    * @param {string} table - nombre de la tabla
    * @param {function} callback - funcion a ejecutar cuando se obtengan los metadatos
    */
    __keysInTable(table,callback)
    {
        return new Promise((res,rej)=>
        {
            this.query(`${this.__information_schema}'${table}'`)
                .then(result=>{
                    if(!this.inModel(table,res,result.length==0))
                    {
                        if(result.length==0)
                            rej("la tabla no existe")
                        else
                            res((new model(result[0].sql,this.__escapeChar)).getData())
                    }
                }).catch(rej)
        })

    }

}

module.exports=sqlite3Tab
