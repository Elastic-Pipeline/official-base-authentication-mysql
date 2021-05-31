import path from "path";
import fs from 'fs';
import { Module, ModuleManager } from "../../API/Modules/Module";
import { MySQLDataStore } from "./classes/MySQLDataStore";
import { DataStore } from "../official-base-authentication/classes/DataStore";

class BaseModule extends Module
{
    constructor()
    {
        super("Base Authentication", fs.readFileSync(path.resolve(__dirname, "./version.txt")).toString("utf-8"));

        const dataStoreInterface = new MySQLDataStore(path.resolve(__dirname, 'data'));
        DataStore.RegisterInterface(dataStoreInterface);
    }
}

ModuleManager.RegisterModule(new BaseModule());