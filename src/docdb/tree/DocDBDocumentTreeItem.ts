/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DocumentClient, RetrievedDocument } from 'documentdb';
import * as vscode from 'vscode';
import { AzureTreeItem, DialogResponses, UserCancelledError } from 'vscode-azureextensionui';
import { getThemeAgnosticIconPath } from '../../constants';
import { getDocumentTreeItemLabel } from '../../utils/vscodeUtils';
import { DocDBDocumentsTreeItem } from './DocDBDocumentsTreeItem';
import { IDocDBTreeRoot } from './IDocDBTreeRoot';

/**
 * Represents a Cosmos DB DocumentDB (SQL) document
 */
export class DocDBDocumentTreeItem extends AzureTreeItem<IDocDBTreeRoot> {
    public static contextValue: string = "cosmosDBDocument";
    public readonly contextValue: string = DocDBDocumentTreeItem.contextValue;
    public readonly commandId: string = 'cosmosDB.openDocument';
    public readonly parent: DocDBDocumentsTreeItem;

    private readonly _partitionKeyValue: string | undefined | Object;
    private _label: string;
    private _document: RetrievedDocument;

    constructor(parent: DocDBDocumentsTreeItem, document: RetrievedDocument) {
        super(parent);
        this._document = document;
        this._partitionKeyValue = this.getPartitionKeyValue();
        this._label = getDocumentTreeItemLabel(this._document);
    }

    public get id(): string {
        return this.document._rid || `${this.document.id}:${this.getPartitionKeyValue()}`;
        // Every document has an _rid field, even though the type definitions call it optional. The second clause is fallback.
        // The toString implicit conversion handles undefined and {} as expected. toString satisfies the uniqueness criterion.
    }

    public async refreshImpl(): Promise<void> {
        this._label = getDocumentTreeItemLabel(this._document);
    }

    public get link(): string {
        return this.document._self;
    }

    get document(): RetrievedDocument {
        return this._document;
    }

    get label(): string {
        return this._label;
    }

    public get iconPath(): string | vscode.Uri | { light: string | vscode.Uri; dark: string | vscode.Uri } {
        return getThemeAgnosticIconPath('Document.svg');
    }

    public async deleteTreeItemImpl(): Promise<void> {
        const message: string = `Are you sure you want to delete document '${this.label}'?`;
        const result = await vscode.window.showWarningMessage(message, { modal: true }, DialogResponses.deleteResponse, DialogResponses.cancel);
        if (result === DialogResponses.deleteResponse) {
            const client = this.root.getDocumentClient();
            const options = { partitionKey: this._partitionKeyValue };
            await new Promise((resolve, reject) => {
                // Disabling type check in the next line. This helps ensure documents having no partition key value
                // can still pass an empty object when required. It looks like a disparity between the type settings outlined here
                // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/01e0ffdbab16b15c702d5b8c87bb122cc6215a59/types/documentdb/index.d.ts#L72
                // vs. the workaround outlined at https://github.com/Azure/azure-documentdb-node/issues/222#issuecomment-364286027
                // tslint:disable-next-line:no-any
                client.deleteDocument(this.link, <any>options, err => {
                    err ? reject(err) : resolve();
                });
            });
        } else {
            throw new UserCancelledError();
        }
    }

    public async update(newData: RetrievedDocument): Promise<RetrievedDocument> {
        const client: DocumentClient = this.root.getDocumentClient();
        const _self: string = this.document._self;
        if (["_self", "_etag"].some((element) => !newData[element])) {
            throw new Error(`The "_self" and "_etag" fields are required to update a document`);
        } else {
            const options = { accessCondition: { type: 'IfMatch', condition: newData._etag }, partitionKey: this._partitionKeyValue };
            this._document = await new Promise<RetrievedDocument>((resolve, reject) => {
                client.replaceDocument(
                    _self,
                    newData,
                    //tslint:disable-next-line:no-any
                    <any>options,
                    (err, updated: RetrievedDocument) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(updated);
                        }
                    });
            });
            return this.document;
        }
    }

    private getPartitionKeyValue(): string | undefined | Object {
        const partitionKey = this.parent.parent.partitionKey;
        if (!partitionKey) { //Fixed collections -> no partitionKeyValue
            return undefined;
        }
        const fields = partitionKey.paths[0].split('/');
        if (fields[0] === '') {
            fields.shift();
        }
        let value;
        for (const field of fields) {
            value = value ? value[field] : this.document[field];
            if (!value) { //Partition Key exists, but this document doesn't have a value
                return '';
            }
        }
        return value;
    }
}
