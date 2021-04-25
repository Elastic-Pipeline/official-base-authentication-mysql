import mysql from "mysql";
import { Logger } from "../../../API/Logging";
import { DataStoreInterface } from "../../official-base-authentication/classes/DataStore";

export class MySQLDataStore extends DataStoreInterface
{
    private db: mysql.Connection;

    constructor(_dataFolder: string)
    {
        super();

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
}