/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IAzureTreeItem } from 'vscode-azureextensionui';
import { CollectionMeta, DatabaseMeta } from 'documentdb';
import { DocDBDatabaseTreeItemBase } from '../../docdb/tree/DocDBDatabaseTreeItemBase';
import { GraphCollectionTreeItem } from './GraphCollectionTreeItem';

export class GraphDatabaseTreeItem extends DocDBDatabaseTreeItemBase {
    public static contextValue: string = "cosmosDBGraphDatabase";
    public readonly contextValue: string = GraphDatabaseTreeItem.contextValue;
    public readonly childTypeLabel: string = 'Graph';

    private _possibleGremlinEndpoints: string[];
    private _graphPort: number;

    constructor(documentEndpoint: string, masterKey: string, database: DatabaseMeta, parentId: string) {
        super(documentEndpoint, masterKey, database, parentId);
        this._parseEndpoint(documentEndpoint);
    }

    public initChild(collection: CollectionMeta): IAzureTreeItem {
        return new GraphCollectionTreeItem(this, collection, this.id);
    }

    private _parseEndpoint(documentEndpoint: string): void {
        // Document endpoint: https://<graphname>.documents.azure.com:443/
        // Old-style (before Dec 20, 2017) gremlin endpoint: <graphname>.graphs.azure.com
        // New-style gremlin endpoint: <graphname>.gremlin.cosmosdb.azure.com
        let [, address, , port] = documentEndpoint.match(/^[^:]+:\/\/([^:]+)(:([0-9]+))?\/?$/);
        let oldStyleEndpoint = address.replace(".documents.azure.com", ".graphs.azure.com");
        let newStyleEndpoint = address.replace(".documents.azure.com", ".gremlin.cosmosdb.azure.com");
        console.assert(oldStyleEndpoint.match(/\.graphs\.azure\.com$/), "Unexpected endpoint format");
        console.assert(newStyleEndpoint.match(/\.gremlin\.cosmosdb\.azure\.com$/), "Unexpected endpoint format");

        this._possibleGremlinEndpoints = [newStyleEndpoint, oldStyleEndpoint];

        this._graphPort = parseInt(port || "443");
        console.assert(this._graphPort > 0, "Unexpected port");
    }

    get possibleGremlinEndpoints(): string[] {
        return this._possibleGremlinEndpoints;
    }

    get graphPort(): number {
        return this._graphPort;
    }
}
