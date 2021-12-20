const assert= require("assert")
const connect = require("./sqlite3-tab.js")
const sqlite= new connect("./database.sqlite")

console.log(sqlite.query('select sqlite_master.* from sqlite_master').then(resolve=>console.log(resolve)).catch((e)=>console.log(e)))
