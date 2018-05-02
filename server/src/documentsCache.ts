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
    private readonly map = new Map<IDocumentKey, IDocumentContainer>(); // Use WeakMap?
    private readonly keyGenerator = _.memoize((uri: string) => ({ uri }));

    public set(documentUri: string, data: IDocumentData) {
        const key = this.keyGenerator(documentUri);
        const container = _.assign(this.map.get(key), data, { uri: documentUri });
        this.map.set(key, container);
    }

    public get(documentUri: string): IDocumentContainer {
        const key = this.keyGenerator(documentUri);
        const container = this.map.get(key);
        return _.cloneDeep(container);
    }
}