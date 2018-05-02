import * as _ from 'lodash';
import { ILogLine } from "./textLog";
import { ILogTask, ILogOperationDuration } from "./codeNavigator";

export interface IDocumentData {
    lines?: ILogLine[];
    tasks?: ILogTask[];
    longOperations?: ILogOperationDuration[];
}

export interface IDocumentContainer extends IDocumentData {
    readonly uri: string;
}

export class DocumentsCache {
    private readonly map = new Map<string, IDocumentContainer>();

    /**
     * Updated cached properties for the document.
     * @param documentUri Document URI
     * @param data properties to be updated in the cache
     */
    public set(documentUri: string, data: IDocumentData) {
        const container = _.assign(this.map.get(documentUri), data, { uri: documentUri });
        this.map.set(documentUri, container);
    }

    /**
     * Returns cached documen properties. Important: it will return shallow clone,
     * do not change that object.
     * @param documentUri Document URI
     */
    public get(documentUri: string): IDocumentContainer {
        const container = this.map.get(documentUri);
        return _.clone(container);
    }

    /**
     * Deletes cache for the document
     * @param documentUri Document URI
     */
    public dropUri(documentUri: string) {
        this.map.delete(documentUri);
    }

    /**
     * Deletes property for every cached document.
     * @param property cached property. Should be one of IDocumentContainer fields.
     */
    public dropProperty(property: keyof IDocumentData) {
        for (let container of this.map.values()) {
            delete container[property];
        };
    }
}