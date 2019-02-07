/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActivator } from 'activationTypes';
import * as vscode from 'vscode';
import { doubleClickDebounceDelay } from '../constants';
import { ext } from '../extensionVariables';
import { GraphViewsManager } from "./GraphViewsManager";
import { GraphAccountTreeItem } from "./tree/GraphAccountTreeItem";
import { GraphCollectionTreeItem } from "./tree/GraphCollectionTreeItem";
import { GraphDatabaseTreeItem } from "./tree/GraphDatabaseTreeItem";
import { GraphTreeItem } from "./tree/GraphTreeItem";

export function registerGraphCommands(context: vscode.ExtensionContext, activator: IActivator): void {
    let graphViewsManager = new GraphViewsManager(context);

    activator.registerCommand('cosmosDB.createGraphDatabase', async (node?: GraphAccountTreeItem) => {
        if (!node) {
            node = <GraphAccountTreeItem>await ext.tree.showTreeItemPicker(GraphAccountTreeItem.contextValue);
        }
        await node.createChild();
    });
    activator.registerCommand('cosmosDB.createGraph', async (node?: GraphDatabaseTreeItem) => {
        if (!node) {
            node = <GraphDatabaseTreeItem>await ext.tree.showTreeItemPicker(GraphDatabaseTreeItem.contextValue);
        }
        await node.createChild();
    });
    activator.registerCommand('cosmosDB.deleteGraphDatabase', async (node?: GraphDatabaseTreeItem) => {
        if (!node) {
            node = <GraphDatabaseTreeItem>await ext.tree.showTreeItemPicker(GraphDatabaseTreeItem.contextValue);
        }
        await node.deleteTreeItem();
    });
    activator.registerCommand('cosmosDB.deleteGraph', async (node?: GraphCollectionTreeItem) => {
        if (!node) {
            node = <GraphCollectionTreeItem>await ext.tree.showTreeItemPicker(GraphCollectionTreeItem.contextValue);
        }
        await node.deleteTreeItem();
    });
    activator.registerCommand('cosmosDB.openGraphExplorer', async (node: GraphTreeItem) => {
        if (!node) {
            node = <GraphTreeItem>await ext.tree.showTreeItemPicker(GraphTreeItem.contextValue);
        }
        await node.showExplorer(graphViewsManager);
        // tslint:disable-next-line:align
    }, doubleClickDebounceDelay);
}
