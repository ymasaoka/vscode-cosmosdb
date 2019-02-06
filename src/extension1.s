/*--------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

// tslint:disable-next-line:no-var-requires
var utils = require('lazy-cache')(require);
// `npm install glob`
var glob = utils('glob');

console.log(glob.sync('*.js'));
console.log(glob.sync('*.js'));

// glob sync
console.log(utils.glob.sync('*.js'));

// glob async
// tslint:disable-next-line:no-function-expression
utils.glob('*.js', function (_err, files) {
    console.log(files);
});

import * as clipboardy from 'clipboardy';
clipboardy.write('hello');
