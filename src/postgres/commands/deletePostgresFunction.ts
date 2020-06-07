/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window } from 'vscode';
import { DialogResponses, IActionContext } from "vscode-azureextensionui";
import { ext } from "../../extensionVariables";
import { localize } from "../../utils/localize";
import { PostgresFunctionTreeItem } from "../tree/PostgresFunctionTreeItem";

export async function deletePostgresFunction(context: IActionContext, treeItem?: PostgresFunctionTreeItem): Promise<void> {
    if (!treeItem) {
        treeItem = <PostgresFunctionTreeItem>await ext.tree.showTreeItemPicker(PostgresFunctionTreeItem.contextValue, { ...context, suppressCreatePick: true });
    }

    const message: string = localize('deleteFunction', 'Are you sure you want to delete function "{0}"?', treeItem.label);
    await ext.ui.showWarningMessage(message, { modal: true }, DialogResponses.deleteResponse);
    await treeItem.deleteTreeItem(context);
    const deleteMessage: string = localize('successfullyDeletedFunction', 'Successfully deleted function "{0}".', treeItem.label);
    window.showInformationMessage(deleteMessage);
    ext.outputChannel.appendLog(deleteMessage);
}
