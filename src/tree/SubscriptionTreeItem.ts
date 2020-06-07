/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CosmosDBManagementClient } from 'azure-arm-cosmosdb';
import { DatabaseAccount, DatabaseAccountListKeysResult, DatabaseAccountsListResult } from 'azure-arm-cosmosdb/lib/models';
import { PostgreSQLManagementClient } from 'azure-arm-postgresql';
import { Server, ServerListResult } from 'azure-arm-postgresql/lib/models';
import * as vscode from 'vscode';
import { AzExtTreeItem, AzureTreeItem, AzureWizard, AzureWizardPromptStep, createAzureClient, ICreateChildImplContext, ILocationWizardContext, LocationListStep, ResourceGroupListStep, SubscriptionTreeItemBase } from 'vscode-azureextensionui';
import { API, getExperienceLabel, tryGetExperience } from '../AzureDBExperiences';
import { DocDBAccountTreeItem } from "../docdb/tree/DocDBAccountTreeItem";
import { ext } from '../extensionVariables';
import { tryGetGremlinEndpointFromAzure } from '../graph/gremlinEndpoints';
import { GraphAccountTreeItem } from "../graph/tree/GraphAccountTreeItem";
import { MongoAccountTreeItem } from '../mongo/tree/MongoAccountTreeItem';
import { IPostgresWizardContext } from '../postgres/commands/PostgresAccountWizard/IPostgresWizardContext';
import { PostgresServerTreeItem } from '../postgres/tree/PostgresServerTreeItem';
import { TableAccountTreeItem } from "../table/tree/TableAccountTreeItem";
import { azureUtils } from '../utils/azureUtils';
import { localize } from '../utils/localize';
import { nonNullProp } from '../utils/nonNull';
import { AzureDBAPIStep } from './AzureDBAPIStep';
import { ICosmosDBWizardContext } from './CosmosDBAccountWizard/ICosmosDBWizardContext';

export class SubscriptionTreeItem extends SubscriptionTreeItemBase {
    public childTypeLabel: string = 'Account';

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean): Promise<AzExtTreeItem[]> {

        let treeItemPostgres: AzExtTreeItem[];
        let treeItem: AzExtTreeItem[];

        //Postgres
        const postgresClient: PostgreSQLManagementClient = createAzureClient(this.root, PostgreSQLManagementClient);
        const postgresServers: ServerListResult = await postgresClient.servers.list();
        treeItemPostgres = await this.createTreeItemsWithErrorHandling(
            postgresServers,
            'invalidPostgreSQLAccount',
            async (server: Server) => new PostgresServerTreeItem(this, server),
            (server: Server) => server.name
        );

        //CosmosDB
        const client: CosmosDBManagementClient = createAzureClient(this.root, CosmosDBManagementClient);
        const accounts: DatabaseAccountsListResult = await client.databaseAccounts.list();
        treeItem = await this.createTreeItemsWithErrorHandling(
            accounts,
            'invalidCosmosDBAccount',
            async (db: DatabaseAccount) => await this.initCosmosDBChild(client, db),
            (db: DatabaseAccount) => db.name
        );

        treeItem.push(...treeItemPostgres);
        return treeItem;
    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzureTreeItem> {
        const client: CosmosDBManagementClient = createAzureClient(this.root, CosmosDBManagementClient);
        const wizardContext: IPostgresWizardContext & ICosmosDBWizardContext = Object.assign(context, this.root);

        const promptSteps: AzureWizardPromptStep<ILocationWizardContext>[] = [
            new AzureDBAPIStep(),
            new ResourceGroupListStep()
        ];
        LocationListStep.addStep(wizardContext, promptSteps);

        const wizard = new AzureWizard(wizardContext, {
            promptSteps,
            executeSteps: [],
            title: localize('createDBServerMsg', 'Create new Azure Database Server')
        });

        await wizard.prompt();

        wizardContext.telemetry.properties.defaultExperience = wizardContext.defaultExperience?.api;

        const newServerName: string = nonNullProp(wizardContext, 'newServerName');
        context.showCreatingTreeItem(newServerName);
        await wizard.execute();
        if (wizardContext.defaultExperience?.api === API.Postgres) {
            const createMessage: string = localize('createdServerOutput', 'Successfully created PostgreSQL server "{0}".', wizardContext.newServerName);
            vscode.window.showInformationMessage(createMessage);
            ext.outputChannel.appendLog(createMessage);
            return new PostgresServerTreeItem(this, nonNullProp(wizardContext, 'server'));
        } else {
            return await this.initCosmosDBChild(client, nonNullProp(wizardContext, 'databaseAccount'));
        }
    }

    public isAncestorOfImpl(contextValue: string | RegExp): boolean {
        return typeof contextValue !== 'string' || !/attached/i.test(contextValue);
    }

    private async initCosmosDBChild(client: CosmosDBManagementClient, databaseAccount: DatabaseAccount): Promise<AzureTreeItem> {
        const experience = tryGetExperience(databaseAccount);
        const id: string = nonNullProp(databaseAccount, 'id');
        const name: string = nonNullProp(databaseAccount, 'name');
        const documentEndpoint: string = nonNullProp(databaseAccount, 'documentEndpoint');

        const resourceGroup: string = azureUtils.getResourceGroupFromId(id);
        const accountKindLabel = getExperienceLabel(databaseAccount);
        const label: string = name + (accountKindLabel ? ` (${accountKindLabel})` : ``);
        const isEmulator: boolean = false;

        if (experience && experience.api === "MongoDB") {
            const result = await client.databaseAccounts.listConnectionStrings(resourceGroup, name);
            const connectionString: URL = new URL(nonNullProp(nonNullProp(result, 'connectionStrings')[0], 'connectionString'));
            // for any Mongo connectionString, append this query param because the Cosmos Mongo API v3.6 doesn't support retrywrites
            // but the newer node.js drivers started breaking this
            const searchParam: string = 'retrywrites';
            if (!connectionString.searchParams.has(searchParam)) {
                connectionString.searchParams.set(searchParam, 'false');
            }

            // Use the default connection string
            return new MongoAccountTreeItem(this, id, label, connectionString.toString(), isEmulator, databaseAccount);
        } else {
            const keyResult: DatabaseAccountListKeysResult = await client.databaseAccounts.listKeys(resourceGroup, name);
            const primaryMasterKey: string = nonNullProp(keyResult, 'primaryMasterKey');
            switch (experience && experience.api) {
                case "Table":
                    return new TableAccountTreeItem(this, id, label, documentEndpoint, primaryMasterKey, isEmulator, databaseAccount);
                case "Graph": {
                    const gremlinEndpoint = await tryGetGremlinEndpointFromAzure(client, resourceGroup, name);
                    return new GraphAccountTreeItem(this, id, label, documentEndpoint, gremlinEndpoint, primaryMasterKey, isEmulator, databaseAccount);
                }
                case "Core":
                default:
                    // Default to DocumentDB, the base type for all Cosmos DB Accounts
                    return new DocDBAccountTreeItem(this, id, label, documentEndpoint, primaryMasterKey, isEmulator, databaseAccount);

            }
        }
    }
}
