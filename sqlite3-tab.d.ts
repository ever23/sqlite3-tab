import {
    Connect,
    dbTabla,
    SelectOptions,
    WhereClause,
    WhereObject,
    ColumnList,
    JoinsClause,
    JoinsObject,
    dbResult,
    dbRow,
    DbRowRecord
} from 'dbtabla';

export class sqlite3Tab extends Connect {
    connection: any;
    constructor(params: string | any);
    serialize(call: Function): any;
    parallelize(call: Function): any;
    tabla<T = Record<string, any>>(tabla: string, callback?: (t: dbTabla<T>, error?: any) => void, verify?: boolean): dbTabla<T>;
    query(query: string): Promise<any>;
    beginTransaction(): Promise<any>;
    commit(): Promise<any>;
    rollback(): Promise<any>;
    close(): Promise<any>;
}

export {
    SelectOptions,
    WhereClause,
    WhereObject,
    ColumnList,
    JoinsClause,
    JoinsObject,
    dbResult,
    dbRow,
    DbRowRecord,
    dbTabla,
    Connect
};

export default sqlite3Tab;
