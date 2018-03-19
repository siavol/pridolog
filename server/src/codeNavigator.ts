import * as _ from 'lodash'
import { Location, Range, Position } from 'vscode-languageserver'
import { DocumentsProvider } from './documentsProvider'
import { parseTextLog, ILogLine } from './textLog'
import { services, getServiceByRequestPath } from './prizmServices'

export interface ILogTask {
    taskBegin: ILogLine;
    taskEnd: ILogLine;
}

export interface ILogOperationDuration {
    logLine: ILogLine;
    durationMs: number;
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

            if (serviceFile instanceof RegExp) {
                // TODO: support this case
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
                    let serviceLogUri: string[];
                    const logFile = service.logFile;
                    if (logFile instanceof RegExp) {
                        serviceLogUri = this.documentsProvider.getDocuments()
                            .filter(file => logFile.test(file));
                        console.log(serviceLogUri);
                    } else {
                        const logFileUri = this.documentsProvider.getUriForRelativePath(logFile);
                        serviceLogUri = [ logFileUri ];
                    }

                    for (let i = 0; i < serviceLogUri.length; i++) {
                        const logFileUri = serviceLogUri[i];
                        const text = this.documentsProvider.getDocumentText(logFileUri);

                        const reqTime = Date.parse(reqLogItem.time);
                        const logLines = parseTextLog(text);
                        const defLogItem = _(logLines)
                            .filter(logLine => logLine.logItem.gid === reqLogItem.gid)
                            .filter(logLine => logLine.logItem.reqBegin)
                            .filter(logLine => this.isSameRequest(logLine.logItem.req, reqLogItem.req))
                            .filter(logLine => Date.parse(logLine.logItem.time) <= reqTime)
                            .last();

                        if (defLogItem) {
                            return Location.create(logFileUri, Range.create(
                                Position.create(defLogItem.line, 0),
                                Position.create(defLogItem.line, defLogItem.source.length)
                            ));
                        }
                    }

                    return null;
                }
            }
        }

        return null;
    }

    private isSameRequest(req1: any, req2: any) {
        if (!req1 || !req2) {
            return false;
        }
        if (req1.method && req2.method && req1.method !== req2.method) {
            return false;
        }

        const req1Parts = req1.path.split('?');
        const req2Parts = req2.path.split('?');

        if (req1Parts.length > 1 && req2Parts.length > 1) {
            return req1.path === req2.path;
        } else {
            return req1Parts[0] === req2Parts[0];
        }
    }

    private getLogFileForRequest(/*method: string,*/ path: string): string|RegExp {
        const serviceInfo = getServiceByRequestPath(path);
        return serviceInfo ? serviceInfo.logFile : null;
    }

    private getTaskKey(logItem: any) {
        return `${logItem.gid}::${logItem.taskid}`;
    }

    public getTasksFromTheLogFile(uri: string): ILogTask[] {
        const text = this.documentsProvider.getDocumentText(uri);
        const logLines = parseTextLog(text);

        let tasksMap = new Map<string, ILogTask>();

        logLines.forEach(logLine => {
            if (logLine.logItem.taskBegin) {
                const task = {
                    taskBegin: logLine,
                    taskEnd: null as ILogLine
                };
                
                tasksMap.set(this.getTaskKey(logLine.logItem), task);
            } else if (logLine.logItem.taskEnd) {
                const task = tasksMap.get(this.getTaskKey(logLine.logItem));
                if (task) {
                    task.taskEnd = logLine;
                }
            }
        });

        return Array.from(tasksMap.values());
    }

    public getOperationsLongerThan(uri: string, minDuration: number): ILogOperationDuration[] {
        const text = this.documentsProvider.getDocumentText(uri);
        const logLines = parseTextLog(text);

        let lastTaskLineMap = new Map<string, ILogLine>();
        let result = [] as ILogOperationDuration[];

        logLines.forEach(logLine => {
            const key = this.getTaskKey(logLine.logItem);
            const prevLogLine = lastTaskLineMap.get(key);
            if (prevLogLine) {
                const prevTime = Date.parse(prevLogLine.logItem.time);
                const thisTime = Date.parse(logLine.logItem.time);
                const durationMs = thisTime - prevTime;
                if (durationMs > minDuration) {
                    result.push({ logLine: prevLogLine, durationMs });
                }
            }
            lastTaskLineMap.set(key, logLine);
        });

        return result;
    }
}