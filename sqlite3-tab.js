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
    * @param {object} param - configuracion para mysql
    *
    */
    constructor(params)
    {
        super(params,SQLITE3_DB)
        this.conection=new sqlite3.Database(params)
        /*if(connect)
            this.conection.connect()*/
        this.__escapeChar="`"
        this.__information_schema = "select sqlite_master.* from sqlite_master where  name="
        
        sqlite3Tab.__caheTablas={}
    }
    /**
    * construlle un objeto dbtabla asociado a el nombre
    * de la tabla del primer parametro
    * @param {string} tabla - nombre de la tabla en la base de datos
    * @param {function} callback - funcion anomina que se ejecutara cuando se verifique la existencia de la tabla
    * @return {dbTabla}
    */
    tabla(tabla,callback,create=false)
    {
        if(typeof callback ==="boolean")
            create=callback
        if(typeof sqlite3Tab.__caheTablas[tabla]!=="undefined")
        {
            return sqlite3Tab.__caheTablas[tabla]
        }
        return  sqlite3Tab.__caheTablas[tabla] = new sqlite3Tabla({
            tabla:tabla,
            conection:this,
            callback:t=>typeof callback==="function"?callback(t):null,
            config:this.helpersConf()
        },typeof callback==="function" && create)

    }
    /**
    * conecta con la base de datos
    * 
    */
    connect()
    {
        //this.conection.connect(callback)
    }
    /**
    * envia una consulta a la base de datos
    * @param {string} query - consulta sql
    * @return {Promise}
    */
    query(query,option)
    {
        return new Promise((resolver,reject)=>
        {
        
            if(/^[\s]*select/i.test(query))
            {
                
                this.conection.all(query,(error,result)=>
                {
                    if(error)
                    {
                        return reject(error)
                    }
                    resolver(result)
                })
            }else{
                this.conection.run(query,option,(error,result)=>
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
    * escapa el texto sql
    * @param {string} str - texto
    * @return {string}
    */
    __escapeString(str)
    {
        return str
    }
    /**
    * termina la coneccion
    */
    end()
    {
        this.conection.close()
    }
    /**
    * termina la coneccion
    */
    close()
    {
        this.conection.close()
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
        //console.log(this.conection.database);
        this.query(`${this.__information_schema}'${table}'`)
            .then(result=>{
                
                if(!this.inModel(table,callback,result.length==0))
                {
                    if(result.length==0)
                        throw "la tabla no existe"
                    this.__procesingKeys(table,result[0].sql,callback)
                }
               
            }).catch(e=>{throw e})
    }
    /**
    * procesa los metadatos y los pasa a la funcion
    * @param {string} table - nombre de la tabla
    * @param {array} data - metadatos crudos
    * @param {function} callback - funcion a ejecutar cuando se obtengan los metadatos
    *
    */
    __procesingKeys(table,sql,callback)
    {
        let m= new model(sql,this.__escapeChar)
        //console.log(m.keys())
        callback(m.getData())
    }
}

module.exports=sqlite3Tab
