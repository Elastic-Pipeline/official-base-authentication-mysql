import mysql from "mysql";
import { final } from "../../../API/Common/FinalDecoration";
import { Logger } from "../../../API/Common/Logging";
import { DataStoreInterface, DataStoreParameter, DataStoreTableVariable, DataStoreTableVariableModifiers } from "../../official-base-authentication/classes/DataStore";

@final
export class DataStoreTableVariableMySQL extends DataStoreTableVariable
{
    constructor(_name: string, _varType: string, _modifiers: DataStoreTableVariableModifiers = {})
    {
        super(_name, _varType, _modifiers);
    }
    public DisplayModifiers() : string
    {
        var ret: string[] = [];

        if (this.modifiers.PRIMARY_KEY)
            ret.push("PRIMARY KEY");
        if (this.modifiers.UNIQUE)
            ret.push("UNIQUE");
        if (this.modifiers.DEFAULT)
            ret.push(`DEFAULT ${this.modifiers.DEFAULT}`);
        if (this.modifiers.AUTO_INCREMENT)
            ret.push("AUTO_INCREMENT");
        else if (this.modifiers.NOT_NULL)
            ret.push("NOT NULL");
        if (this.modifiers.ON_UPDATE)
            ret.push(`ON UPDATE ${this.modifiers.ON_UPDATE}`);
        if (this.modifiers.ON_DELETE)
            ret.push(`ON DELETE ${this.modifiers.ON_DELETE}`);
        if (this.modifiers.COMMENT)
            ret.push(`COMMENT ${this.modifiers.COMMENT}`);
        return ret.join(" ");
    }
}


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
            database: 'elastic-pipeline',
            user: "root",
            password: ""
        });
        this.db.connect((err) => {
            // Check for connection errors...
            if (err)
            {
                Logger.error("MySQL Exec Exception ::>", err);
                return;
            }
            this.isReady = true;
        });
    }
    private ConvertVariables(_variables: DataStoreTableVariable[]) : DataStoreTableVariableMySQL[]
    {
        const ret: DataStoreTableVariableMySQL[] = [];
        for (let index = 0; index < _variables.length; index++)
        {
            const variable = _variables[index];
            ret.push(new DataStoreTableVariableMySQL(variable.GetName(), variable.GetVarType(), variable.GetModifiers()));
        }
        return ret;
    }

    public AllSync(_string: string, _values: any[]) : Promise<any[]>
    {
        if (!this.isReady)
            return new Promise<any[]>((resolve, reject) => { reject("Execution isn't ready yet!"); });

        return new Promise<any[]>((resolve, reject) => {
            this.Exec(_string, _values, (err: Error|null, ..._args: any[]) => {
                if (err)
                    return reject(err + ` - ${_string} (${_values})`);
                const rows = _args[0] || [];
                return resolve(rows);
            });
        });
    }

    public ExecSync(_string: string, _values: any[]): Promise<void>
    {
        console.log(_string);
        if (!this.isReady)
            return new Promise<void>((resolve, reject) => { reject("Execution isn't ready yet!"); });

        return new Promise<void>((resolve, reject) => {
            this.Exec(_string, _values, (err: Error|null, ..._args: any[]) => {
                if (err)
                    return reject(err + ` - ${_string} (${_values})`);

                return resolve();
            });
        });
    }

    public Exec(_string: string, _values: any[], _cb: (_err: Error|null, ..._args: any[]) => void): void
    {
        if (!this.isReady)
            throw new Error("Execution isn't ready yet!");

        // Execute the prepared statement.
        const query = this.db.query(_string, _values, (sqlErr, sqlResults, sqlFields) =>
        {
            _cb(sqlErr, sqlResults, sqlFields);
        });
        // console.log(query.sql);
    }

    public async CreateTable(_tableName: string, ..._variables: DataStoreTableVariable[]): Promise<boolean>
    {
        if (_variables.length == 0)
        {
            Logger.error(`Creating Table: ${_tableName} - Failed, needs variables.`);
            return false;
        }
        const convertedVariables = this.ConvertVariables(_variables);
        try
        {
            await this.ExecSync(`CREATE TABLE IF NOT EXISTS \`${_tableName}\` ( ${(convertedVariables as DataStoreTableVariableMySQL[]).join(',')} )`, []);
            return true;
        }
        catch(err)
        {
            Logger.error(`Creating Table: ${_tableName} - Exception ::> ${err}`);
        }

        return false;
    }
    public async FetchFromTable(_tableName: string, _items: string[], _where: string[], _params: any[], _postfix: string): Promise<any[]>
    {
        var whereStr: string = "";
        if (_where.length > 0)
        {
            whereStr = "WHERE " + _where.join(' AND ');
        }

        try
        {
            return await this.AllSync(`SELECT ${_items.join(',')} FROM \`${_tableName}\` ${whereStr} ${_postfix}`, _params);
        }
        catch(err)
        {
            Logger.error(`Fetching from Table: ${_tableName} - Exception ::> ${err}`);
        }

        return [];
    }
    public async InsertToTable(_tableName: string, ..._parameters: DataStoreParameter[]): Promise<boolean>
    {
        var variableNames: string[] = [];
        var variableValues: any[] = [];
        for (let index = 0; index < _parameters.length; index++)
        {
            const variable = _parameters[index];
            variableNames.push(`\`${variable.GetName()}\``);
            variableValues.push(variable.GetValue());
        }

        try
        {
            await this.ExecSync(`INSERT INTO \`${_tableName}\` ( ${variableNames.join(',')} ) VALUES ( ${_parameters.join(',')} )`, variableValues);
            return true;
        }
        catch(err)
        {
            Logger.error(`Inserting into Table: ${_tableName} - Exception ::> ${err}`);
        }

        return false;
    }
    public async GetLastInsertID(_tableName: string): Promise<number>
    {
        try
        {
            const rows = await this.AllSync(`SELECT LAST_INSERT_ID();`, []);
            return rows[0]['LAST_INSERT_ID()'];
        }
        catch(err)
        {
            Logger.error(`Last Insert ID: ${_tableName} - Exception ::> ${err}`);
        }

        return -1;
    }
    public async UpdateTable(_tableName: string, _where: string[], ..._parameters: DataStoreParameter[]): Promise<boolean>
    {
        var variableNames: string[] = [];
        var variableValues: any[] = [];
        for (let index = 0; index < _parameters.length; index++) {
            const variable = _parameters[index];
            variableNames.push(`\`${variable.GetName()}\` = ?`);
            variableValues.push(variable.GetValue());
        }

        var whereStr: string = "";
        if (_where.length > 0)
        {
            whereStr = "WHERE " + _where.join(' && ');
        }

        try
        {
            await this.ExecSync(`UPDATE \`${_tableName}\` SET ${variableNames.join(',')} ${whereStr}`, variableValues);
            return true;
        }
        catch(err)
        {
            Logger.error(`Update Table: ${_tableName} - Exception ::> ${err}`);
        }

        return false;
    }
    public async RemoveRowFromTable(_tableName: string, _where: string[]): Promise<boolean>
    {
        var whereStr: string = "";
        if (_where.length > 0)
        {
            whereStr = "WHERE " + _where.join(' && ');
        }

        try
        {
            await this.ExecSync(`DELETE FROM \`${_tableName}\` ${whereStr}`, []);
            return true;
        }
        catch(err)
        {
            Logger.error(`Remove Row From Table: ${_tableName} - Exception ::> ${err}`);
        }

        return false;
    }
    public async DeleteTable(_tableName: string): Promise<boolean>
    {
        try
        {
            await this.ExecSync(`DROP TABLE IF EXISTS \`${_tableName}\``, []);
            return true;
        }
        catch(err)
        {
            Logger.error(`Delete Table: ${_tableName} - Exception ::> ${err}`);
        }

        return false;
    }
}