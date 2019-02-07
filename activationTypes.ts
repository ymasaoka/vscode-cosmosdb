/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//asdf
export interface IPackage {
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

export interface IActionContext {
    properties: TelemetryProperties;
    measurements: TelemetryMeasurements;

    /**
     * Defaults to `false`. If true, successful events are suppressed from telemetry, but cancel and error events are still sent.
     */
    suppressTelemetry?: boolean;

    /**
     * Defaults to `false`
     */
    suppressErrorDisplay?: boolean;

    /**
     * Defaults to `false`
     */
    rethrowError?: boolean;
}

export interface TelemetryProperties {
    /**
     * Defaults to `false`
     * This is used to more accurately track usage, since activation events generally shouldn't 'count' as usage
     */
    isActivationEvent?: 'true' | 'false';
    result?: 'Succeeded' | 'Failed' | 'Canceled';
    error?: string;
    errorMessage?: string;
    cancelStep?: string;
    [key: string]: string | undefined;
}

export interface TelemetryMeasurements {
    duration?: number;
    [key: string]: number | undefined;
}

export type RegisterCommand = (commandId: string, callback: (this: IActionContext, ...args: unknown[]) => unknown, debounce?: number) => void;

export interface IActivator {
    // events
    setRegisterCommand(realRegisterCommand: RegisterCommand);

    registerCommand: RegisterCommand;
    lockCommands(): void;
    registerCommands(packageJsonContents: string, activator: IActivator): void;
}
