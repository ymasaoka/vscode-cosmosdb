/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { CosmosDBManagementClient } from 'azure-arm-cosmosdb';
import { ResourceManagementClient } from 'azure-arm-resource';
import * as vscode from 'vscode';
import { TestAzureAccount } from 'vscode-azureextensiondev';
import { AzExtTreeDataProvider, AzureAccountTreeItemWithAttached, createAzureClient, ext } from '../../extension.bundle';
import { longRunningTestsEnabled } from '../global.test';

export let testAccount: TestAzureAccount;
export let client: CosmosDBManagementClient;
export const resourceGroupsToDelete: string[] = [];

suiteSetup(async function (this: Mocha.Context): Promise<void> {
    if (longRunningTestsEnabled) {
        this.timeout(2 * 60 * 1000);
        testAccount = new TestAzureAccount(vscode);
        await testAccount.signIn();
        ext.azureAccountTreeItem = new AzureAccountTreeItemWithAttached(testAccount);
        ext.tree = new AzExtTreeDataProvider(ext.azureAccountTreeItem, 'azureDatabases.loadMore');
        client = createAzureClient(testAccount.getSubscriptionContext(), CosmosDBManagementClient);
    }
});

suiteTeardown(async function (this: Mocha.Context): Promise<void> {
    if (longRunningTestsEnabled) {
        this.timeout(10 * 60 * 1000);
        await deleteResourceGroups();
        ext.azureAccountTreeItem.dispose();
    }
});

async function deleteResourceGroups(): Promise<void> {
    const rmClient: ResourceManagementClient = createAzureClient(testAccount.getSubscriptionContext(), ResourceManagementClient);
    await Promise.all(resourceGroupsToDelete.map(async resourceGroup => {
        if (await rmClient.resourceGroups.checkExistence(resourceGroup)) {
            console.log(`Deleting resource group "${resourceGroup}"...`);
            await rmClient.resourceGroups.beginDeleteMethod(resourceGroup);
            console.log(`Resource group "${resourceGroup}" deleted.`);
        } else {
            // If the test failed, the resource group might not actually exist
            console.log(`Ignoring resource group "${resourceGroup}" because it does not exist.`);
        }
    }));
}
