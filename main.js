/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//"use strict";

// This is the extension entrypoint module, which imports extension.bundle.js, the actual extension code.
//
// This is in a separate file so we can properly measure extension.bundle.js load time.

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

Object.defineProperty(exports, "__esModule", { value: true });

let perfStats = {
    loadStartTime: Date.now(),
    loadEndTime: undefined
};

let extension;

setTimeout(async () => {
    extension = require("./dist/extension.bundle");
    return await extension.activateInternal(ctx, perfStats);
}, 0);

async function activate(ctx) {
    registerCommands();
}

async function deactivate(ctx) {
    if (extension) {
        return await extension.deactivateInternal(ctx, perfStats);
    }
}

// Export as entrypoints for vscode
exports.activate = activate;
exports.deactivate = deactivate;

perfStats.loadEndTime = Date.now();

function registerCommands() {
    const package = fs.readFileSync(path.join(__dirname, 'package.json'));
    const packageJson = JSON.parse(package);

    for (let command of packageJson.contributes.commands) {
        vscode.commands.registerCommand(command.command, (...args) => callback(command.command, args));
    }
}

function callback(command, ...args) {
    console.log(command, ...args);
}
