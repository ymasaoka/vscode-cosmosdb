// tslint:disable:no-useless-files
// class Initializer {
//     return createApiProvider([<AzureExtensionApi>{
//         findTreeItem,
//         pickTreeItem,
//         apiVersion: '1.0.0'
//     }]);
// }

// import { findTreeItem } from './commands/api/findTreeItem';
// import { pickTreeItem } from './commands/api/pickTreeItem';

// export interface AzureExtensionApi {
//     /**
//      * The API version for this extension. It should be versioned separately from the extension and ideally remains backwards compatible.
//      */
//     apiVersion: string;
// }

// export interface AzureExtensionApiProvider {
//     /**
//      * Provides the API for an Azure Extension.
//      *
//      * @param apiVersionRange The version range of the API you need. Any semver syntax is allowed. For example "1" will return any "1.x.x" version or "1.2" will return any "1.2.x" version
//      * @throws Error if a matching version is not found.
//      */
//     getApi<T extends AzureExtensionApi>(apiVersionRange: string): T;
// }

// export interface AzureExtensionApiProvider {
//     /**
//      * Provides the API for an Azure Extension.
//      *
//      * @param apiVersionRange The version range of the API you need. Any semver syntax is allowed. For example "1" will return any "1.x.x" version or "1.2" will return any "1.2.x" version
//      * @throws Error if a matching version is not found.
//      */
//     getApi<T extends AzureExtensionApi>(apiVersionRange: string): T;
// }
