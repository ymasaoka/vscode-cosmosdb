/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Client, ClientConfig } from "pg";
import pgStructure, { Db } from "pg-structure";
import { Uri } from 'vscode';
import { getThemedIconPath } from "../../constants";
import { PostgresDatabaseTreeItem } from "./PostgresDatabaseTreeItem";
import { PostgresResourcesTreeItemBase } from "./PostgresResourcesTreeItemBase";
import { PostgresTableTreeItem } from "./PostgresTableTreeItem";

export class PostgresTablesTreeItem extends PostgresResourcesTreeItemBase {
    public static contextValue: string = "postgresTables";
    public readonly contextValue: string = PostgresTablesTreeItem.contextValue;
    public readonly childTypeLabel: string = "Table";
    public readonly label: string = 'Tables';

    constructor(parent: PostgresDatabaseTreeItem, clientConfig: ClientConfig) {
        super(parent);
        this.clientConfig = clientConfig;
    }

    public get iconPath(): string | Uri | { light: string | Uri; dark: string | Uri } {
        return getThemedIconPath('list-unordered.svg');
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean): Promise<PostgresTableTreeItem[]> {

        const client = new Client(this.clientConfig);
        const db: Db = await pgStructure(client);
        this.resourcesAndSchemas = {};
        for (const table of db.tables) {
            this.addResourcesAndSchemasEntry(table.name.trim(), table.schema.name);
        }
        return db.tables.map(table => new PostgresTableTreeItem(
            this,
            table,
            this.isDuplicateResource(table.name.trim())
        ));
    }

    public isAncestorOfImpl(contextValue: string): boolean {
        return contextValue === PostgresTableTreeItem.contextValue;
    }
}
