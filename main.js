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
const dev = require('./out/activation');

Object.defineProperty(exports, "__esModule", { value: true });

let activator = dev.createActivator();
const packageJson = fs.readFileSync(path.join(__dirname, 'package.json'));
activator.registerCommands(packageJson);

let perfStats = {
    loadStartTime: Date.now(),
    loadEndTime: undefined
};

let extension;

async function activate(ctx) {
    setTimeout(async () => {
        extension = require("./dist/extension.bundle");
        let api = await extension.activateInternal(ctx, activator, perfStats);
        activator.lockCommands();
        return api;
    }, 0);
}

async function deactivate(ctx) {
    if (extension) {
        return await extension.deactivateInternal();
    }
}

// Export as entrypoints for vscode
exports.activate = activate;
exports.deactivate = deactivate;

perfStats.loadEndTime = Date.now();
