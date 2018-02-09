import * as _ from 'lodash'
import { Location, Range } from 'vscode-languageserver'
import { DocumentsProvider } from './documentsProvider'
import { parseTextLog } from './textLog'

export class CodeNavigator {
    constructor(private readonly documentsProvider: DocumentsProvider) { }

    public findAllEntriesForGid(gid: string): Location[] {
        const logFiles = this.documentsProvider.getDocuments();
        let result = _(logFiles)
            .map(file => ({ uri: file, text: this.documentsProvider.getDocumentText(file) }))
            .flatMap(file => parseTextLog(file.text).map(line => ({uri: file.uri, text:line.source, line: line.line, logItem:line.logItem})))
            .filter(item => item.logItem.gid === gid)
            .map(item => ({ uri: item.uri, range: Range.create(item.line, 0, item.line, item.text.length-1) }))
            .value();
        return result;
    }

    public getDefinition(logItem: any): Location {
        return null;
    }
}