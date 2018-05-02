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

interface IDocumentKey {
    readonly uri: string;
}

export class DocumentsCache {
    private readonly map = new WeakMap<IDocumentKey, IDocumentContainer>();
    private readonly keyGenerator = _.memoize((uri: string) => ({ uri }));

    /**
     * Updated cached properties for the document.
     * @param documentUri Document URI
     * @param data properties to be updated in the cache
     */
    public set(documentUri: string, data: IDocumentData) {
        const key = this.keyGenerator(documentUri);
        const container = _.assign(this.map.get(key), data, { uri: documentUri });
        this.map.set(key, container);
    }

    /**
     * Returns cached documen properties. Important: it will return shallow clone,
     * do not change that object.
     * @param documentUri Document URI
     */
    public get(documentUri: string): IDocumentContainer {
        const key = this.keyGenerator(documentUri);
        const container = this.map.get(key);
        return _.clone(container);
    }
}