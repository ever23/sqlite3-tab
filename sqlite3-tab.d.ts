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
    DbRowRecord,
    QueryEvent,
    PaginateOptions,
    PaginateResult
} from 'dbtabla';

export interface Sqlite3TabConfig {
    filename?: string;
    database?: string;
    driver?: 'node:sqlite' | 'sqlite3';
    options?: Record<string, any>;
    autoMigrate?: boolean;
    [key: string]: any;
}

export class sqlite3Tab extends Connect {
    connection: any;
    readonly engine: 'node:sqlite' | 'sqlite3';
    constructor(params?: string | Sqlite3TabConfig | any);
    serialize(call: Function): any;
    parallelize(call: Function): any;
    tabla<T = Record<string, any>, TMethods = Record<string, any>>(
        tabla: string,
        callback?: (t: dbTabla<T> & TMethods, error?: any) => void,
        verify?: boolean
    ): dbTabla<T> & TMethods;
    query(query: string): Promise<any>;
    transaction<TResult = any>(callback: (tx: this) => Promise<TResult>): Promise<TResult>;
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
