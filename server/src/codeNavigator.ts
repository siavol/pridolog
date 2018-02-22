import * as _ from 'lodash'
import { Location, Range, Position } from 'vscode-languageserver'
import { DocumentsProvider } from './documentsProvider'
import { parseTextLog, ILogLine } from './textLog'
import { services, getServiceByRequestPath } from './prizmServices'

export interface ILogTask {
    taskBegin: ILogLine;
    taskEnd: ILogLine;
}

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

    public getDefinition(reqLogItem: any): Location {
        if (reqLogItem.reqBegin) {
            const request = reqLogItem.req;
            const serviceFile = this.getLogFileForRequest(/*request.method,*/ request.path);
            if (!serviceFile) {
                return null;
            }

            const serviceLogUri = this.documentsProvider.getUriForRelativePath(serviceFile);
            const text = this.documentsProvider.getDocumentText(serviceLogUri);

            const reqTime = Date.parse(reqLogItem.time);
            const logLines = parseTextLog(text);
            const defLogItem = _(logLines)
                .filter(logLine => logLine.logItem.gid === reqLogItem.gid)
                .filter(logLine => logLine.logItem.reqAccepted)
                .filter(logLine => Date.parse(logLine.logItem.time) >= reqTime)
                .first();

            if (defLogItem) {
                return Location.create(serviceLogUri, Range.create(
                    Position.create(defLogItem.line, 0),
                    Position.create(defLogItem.line, defLogItem.source.length)
                ));
            } else {
                return null;
            }        
        }

        if (reqLogItem.reqAccepted) {
            if (reqLogItem.parent) {
                const service = _.find(services, s => s.name === reqLogItem.parent.name);
                if (service) {
                    const serviceLogUri = this.documentsProvider.getUriForRelativePath(service.logFile);
                    const text = this.documentsProvider.getDocumentText(serviceLogUri);

                    const reqTime = Date.parse(reqLogItem.time);
                    const logLines = parseTextLog(text);
                    const defLogItem =  _(logLines)
                        .filter(logLine => logLine.logItem.gid === reqLogItem.gid)
                        .filter(logLine => logLine.logItem.reqBegin && logLine.logItem.req && logLine.logItem.req.path === reqLogItem.req.path)
                        .filter(logLine => Date.parse(logLine.logItem.time) <= reqTime)
                        .last();

                    if (defLogItem) {
                        return Location.create(serviceLogUri, Range.create(
                            Position.create(defLogItem.line, 0),
                            Position.create(defLogItem.line, defLogItem.source.length)
                        ));
                    } else {
                        return null;
                    }        
                }
            }
        }

        return null;
    }

    private getLogFileForRequest(/*method: string,*/ path: string): string {
        const serviceInfo = getServiceByRequestPath(path);
        return serviceInfo ? serviceInfo.logFile : null;
    }

    public getTasksFromTheLogFile(uri: string): ILogTask[] {
        const text = this.documentsProvider.getDocumentText(uri);
        const logLines = parseTextLog(text);

        let tasksMap = new Map<string, ILogTask>();

        function getKey(logItem: any) {
            return `${logItem.any}::${logItem.taskid}`;
        }

        logLines.forEach(logLine => {
            if (logLine.logItem.taskBegin) {
                const task = {
                    taskBegin: logLine,
                    taskEnd: null as ILogLine
                };
                
                tasksMap.set(getKey(logLine.logItem), task);
            } else if (logLine.logItem.taskEnd) {
                const task = tasksMap.get(getKey(logLine.logItem));
                if (task) {
                    task.taskEnd = logLine;
                }
            }
        });

        return Array.from(tasksMap.values());
    }
}