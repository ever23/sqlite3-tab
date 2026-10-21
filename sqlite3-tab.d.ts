import { Connect, dbTabla } from 'dbtabla';

export class sqlite3Tab extends Connect {
    connection: any;
    constructor(params: string | any);
    serialize(call: Function): any;
    parallelize(call: Function): any;
    tabla(tabla: string, callback?: (t: dbTabla, error?: any) => void, verify?: boolean): dbTabla;
    query(query: string): Promise<any>;
    beginTransaction(): Promise<any>;
    commit(): Promise<any>;
    rollback(): Promise<any>;
    close(): Promise<any>;
}

export default sqlite3Tab;
