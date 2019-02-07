/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Disposable } from 'vscode-jsonrpc';
import { IActionContext, IActivator, RegisterCommand } from './activationTypes';

type Callback = (this: IActionContext, ...args: unknown[]) => unknown;

export function createActivator(): IActivator {
    return new Activator();
}

class LazyAzureTreeDataProvider implements vscode.TreeDataProvider<unknown> {
    getTreeItem(_element: unknown): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return new vscode.TreeItem('Initializing...', vscode.TreeItemCollapsibleState.None);
    }

    getChildren(_element?: unknown): vscode.ProviderResult<unknown[]> {
        return [1];
    }

    public _onDidChangeTreeDataEmitter: vscode.EventEmitter<unknown> = new vscode.EventEmitter<unknown>(); //asdf

    get onDidChangeTreeData(): vscode.Event<unknown> {
        return this._onDidChangeTreeDataEmitter.event;
    }

    getParent(_element: unknown): unknown | undefined {
        return undefined;
    }
}

class Activator implements IActivator {
    private readonly _commandDisposables = new Map<string, Disposable>();
    private readonly _commands = new Map<string, Callback | undefined>();
    private _commandsLockedResolve: () => void;
    private readonly _commandsLockedPromise: Promise<void>;
    private _realRegisterCommand: RegisterCommand;
    private _disposables: Disposable[] = []; //asdf

    constructor() {
        // tslint:disable-next-line:promise-must-complete
        this._commandsLockedPromise = new Promise<void>((resolve, _reject) => {
            this._commandsLockedResolve = resolve;
        });

        console.log('tree');
        const tree = new LazyAzureTreeDataProvider();
        this._disposables.push(vscode.window.registerTreeDataProvider('cosmosDBExplorer', tree));
        let treeView = vscode.window.createTreeView('cosmosDBExplorer', { treeDataProvider: tree });
        this._disposables.push(treeView);
        //tree._onDidChangeTreeDataEmitter.fire();
        treeView.reveal(1);
        //treeView.dispose();
    }

    setRegisterCommand(realRegisterCommand: RegisterCommand) {
        this._realRegisterCommand = realRegisterCommand;
    }

    registerCommand(commandId: string, callback: Callback, _debounce?: number): void {//asdf debounce
        if (!this._commandDisposables.has(commandId)) {
            throw new Error('There is no command asdf ' + commandId);
        }

        this._commands.set(commandId, callback);
    }

    lockCommands(): void {
        this._commandsLockedResolve();
        // asdf validate immediately
    }

    registerCommands(packageJsonContents: string): void {
        const packageJson: IPackage = JSON.parse(packageJsonContents);

        if (packageJson.contributes && packageJson.contributes.commands) {
            for (const commandEntry of packageJson.contributes.commands) {
                //this._commands.set(commandEntry.command, commandEntry);

                let commandDisposable = vscode.commands.registerCommand(
                    commandEntry.command,
                    async (...args: unknown[]) => this.delayCallback(commandEntry.command, args));
                this._commandDisposables.set(commandEntry.command, commandDisposable);
            }
        }
    }

    async delayCallback(commandId: string, ...args: unknown[]): Promise<void> {
        console.log(commandId, ...args); // asdf
        await this._commandsLockedPromise;
        console.log('... ' + commandId); //asdf

        let actualCallback = this._commands.get(commandId);
        if (!actualCallback) {
            throw new Error('Command not found asdf ' + commandId);
        }

        let commandDisposable: Disposable = this._commandDisposables.get(commandId);
        this._commandDisposables.delete(commandId);
        commandDisposable.dispose();

        this._realRegisterCommand(commandId, actualCallback); // asdf debounce

        await actualCallback.call(args);
    }
}

//asdf
interface IPackage {
    name?: string;
    activationEvents?: string[];
    contributes?: {
        views?: {
            [viewContainerName: string]: {
                id: string;
                name: string;
                when?: string;
            }[];
        };
        commands?: {
            command: string;
        }[];
        // menus?: {
        //     'view/title': IMenu[];
        //     'explorer/context': IMenu[];
        //     'view/item/context': IMenu[];
        //     commandPalette: {
        //         command: string;
        //         when?: string;
        //     }[];
        // };
    };
}
