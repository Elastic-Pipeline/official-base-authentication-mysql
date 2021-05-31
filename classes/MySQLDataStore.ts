import mysql from "mysql";
import { Logger } from "../../../API/Common/Logging";
import { DataStoreInterface, DataStoreParameter, DataStoreTableVariable } from "../../official-base-authentication/classes/DataStore";

export class MySQLDataStore extends DataStoreInterface
{
    private db: mysql.Connection;

    constructor(_dataFolder: string)
    {
        super("MySQL");

        this.db = mysql.createConnection(
        {
            host: "localhost",
            port: 3306,
            user: "root",
            password: "password"
        });
    }

    public Exec(_string: string, _values: any[]): void
    {
        this.db.connect((err) => {
            // Check for connection errors...
            if (err)
            {
                Logger.error("MySQL Exec Exception ::>", err);
                return;
            }

            // Exec
            this.db.commit({ sql: _string, values: _values });

            // Close after finished!
            this.db.destroy();
        });
    }

    public CreateTable(_tableName: string, ..._variables: DataStoreTableVariable[]): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    public FetchFromTable(_tableName: string, _items: string[], _where: string[], _params: any[], _postfix: string): Promise<any[]> {
        throw new Error("Method not implemented.");
    }
    public InsertToTable(_tableName: string, ..._parameters: DataStoreParameter[]): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    public GetLastInsertID(_tableName: string): Promise<number> {
        throw new Error("Method not implemented.");
    }
    public UpdateTable(_tableName: string, _where: string[], ..._parameters: DataStoreParameter[]): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    public RemoveRowFromTable(_tableName: string, _where: string[]): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
    public DeleteTable(_tableName: string): Promise<boolean> {
        throw new Error("Method not implemented.");
    }
}