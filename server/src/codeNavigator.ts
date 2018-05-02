import * as _ from 'lodash'
import { Location, Range, Position } from 'vscode-languageserver'
import { DocumentsProvider } from './documentsProvider'
import { parseTextLog, ILogLine } from './textLog'
import { services, getServiceByRequestPath } from './prizmServices'
import { DocumentsCache } from './documentsCache';

export interface ILogTask {
    taskBegin: ILogLine;
    taskEnd: ILogLine;
}

export interface ILogOperationDuration {
    logLine: ILogLine;
    durationMs: number;
}

export class CodeNavigator {
    constructor(
        private readonly documentsProvider: DocumentsProvider,
        private readonly documentsCache: DocumentsCache) { }

    private getLogLines(uri: string): ILogLine[] {
        let cachedDocument = this.documentsCache.get(uri);
        if (cachedDocument && cachedDocument.lines) {
            return cachedDocument.lines;
        } else {
            const text = this.documentsProvider.getDocumentText(uri);
            const logLines = parseTextLog(text);
            this.documentsCache.set(uri, { lines: logLines });
            return logLines;
        }
    }

    public findAllEntriesForGid(gid: string): Location[] {
        const logFiles = this.documentsProvider.getDocuments();
        let result = _(logFiles)
            .map(file => ({ uri: file, lines: this.getLogLines(file) }))
            .flatMap(file => file.lines.map(line => ({uri: file.uri, text:line.source, line: line.line, logItem:line.logItem})))
            .filter(item => item.logItem.gid === gid)
            .map(item => ({ uri: item.uri, range: Range.create(item.line, 0, item.line, item.text.length-1) }))
            .value();
        return result;
    }

    public getDefinition(reqLogItem: any): Location {
        if (reqLogItem.reqBegin) {
            const serviceFile = this.getLogFileForRequest(reqLogItem);
            if (!serviceFile) {
                return null;
            }

            let serviceLogUri: string[];
            if (serviceFile instanceof RegExp) {
                serviceLogUri = this.documentsProvider.getDocuments()
                    .filter(file => serviceFile.test(file));
            } else {
                serviceLogUri = [ this.documentsProvider.getUriForRelativePath(serviceFile) ];
            }

            for (let i = 0; i < serviceLogUri.length; i++) {
                const logFileUri = serviceLogUri[i];
                const logLines = this.getLogLines(logFileUri);

                const reqTime = Date.parse(reqLogItem.time);
                const defLogItem = _(logLines)
                    .filter(logLine => logLine.logItem.gid === reqLogItem.gid)
                    .filter(logLine => logLine.logItem.reqAccepted)
                    .filter(logLine => Date.parse(logLine.logItem.time) >= reqTime)
                    .first();

                if (defLogItem) {
                    return Location.create(logFileUri, Range.create(
                        Position.create(defLogItem.line, 0),
                        Position.create(defLogItem.line, defLogItem.source.length)
                    ));
                }        
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
                    } else {
                        const logFileUri = this.documentsProvider.getUriForRelativePath(logFile);
                        serviceLogUri = [ logFileUri ];
                    }

                    for (let i = 0; i < serviceLogUri.length; i++) {
                        const logFileUri = serviceLogUri[i];
                        const logLines = this.getLogLines(logFileUri);

                        const reqTime = Date.parse(reqLogItem.time);
                        const defLogItem = _(logLines)
                            .filter(logLine => logLine.logItem.gid === reqLogItem.gid)
                            .filter(logLine => logLine.logItem.reqBegin)
                            .filter(logLine => this.isSameRequest(logLine.logItem, reqLogItem))
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

    private isSameRequest(logItem1: any, logItem2: any) {
        if (!logItem1 || !logItem2 || !logItem1.req || !logItem2.req) {
            return false;
        }

        if (logItem1.req.method && logItem2.req.method 
            && logItem1.req.method !== logItem2.req.method) {
            return false;
        }

        const path1 = this.getLogItemReqPath(logItem1);
        const path2 = this.getLogItemReqPath(logItem1);
        const req1Parts = path1.split('?');
        const req2Parts = path2.split('?');

        if (req1Parts.length > 1 && req2Parts.length > 1) {
            return path1 === path2;
        } else {
            return req1Parts[0] === req2Parts[0];
        }
    }

    private getLogItemReqPath(logItem: any): string {
        const request = logItem.req;
        let path: string;
        if (request.path) {
            path = request.path;
        } else if (request.url) {
            const url = /(http|https):\/\/(localhost|127.0.0.1):\d+(.*)/.exec(request.url);
            if (url) {
                path = url[3];
            }
        } else {
            return null;
        }

        if (logItem.name === 'PCCIS') {
            const requestedService = /InternalRequest \((.*)\)/.exec(logItem.msg);
            if (requestedService) {
                path = `/${requestedService[1]}${path}`;
            }
        }

        return path;
    }

    private getLogFileForRequest(logItem: any): string|RegExp {
        let path = this.getLogItemReqPath(logItem);
        const serviceInfo = getServiceByRequestPath(path);
        return serviceInfo ? serviceInfo.logFile : null;
    }

    private getTaskKey(logItem: any) {
        return `${logItem.gid}::${logItem.taskid}`;
    }

    public getTasksFromTheLogFile(uri: string): ILogTask[] {
        const cachedDocument = this.documentsCache.get(uri);
        if (cachedDocument && cachedDocument.tasks) {
            return cachedDocument.tasks;
        } else {
            const logLines = this.getLogLines(uri);

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

            const tasks = Array.from(tasksMap.values());
            this.documentsCache.set(uri, { tasks });
            return tasks;
        }
    }

    public getOperationsLongerThan(uri: string, minDuration: number): ILogOperationDuration[] {
        const cachedDocument = this.documentsCache.get(uri);
        if (cachedDocument && cachedDocument.longOperations) {
            return cachedDocument.longOperations;
        } else {
            const logLines = this.getLogLines(uri);

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

            this.documentsCache.set(uri, { longOperations: result });
            return result;
        }
    }
}