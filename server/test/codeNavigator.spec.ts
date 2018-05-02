import * as sinon from 'sinon'
import { expect } from 'chai'
import * as _ from 'lodash'

import { DocumentsProvider } from '../src/documentsProvider'
import { CodeNavigator } from '../src/codeNavigator'
import { parseTextLog } from '../src/textLog'
import { emailSession, ccsOfficeToPdfConversionSession, pccisSession, plbToCcsSession } from './testLogs'
import { DocumentsCache } from '../src/documentsCache';

describe('CodeNavigator', () => {

    describe('findAllEntriesForGid', () => {

        let codeNavigator: CodeNavigator;

        beforeEach(() => {
            const documentsProvider = new DocumentsProvider(null, null);
            sinon.stub(documentsProvider, 'getDocuments')
                .returns([
                    'ECS.log',
                    'OCS.log',
                    'another.log'
                ]);
            const getDocumentText = sinon.stub(documentsProvider, 'getDocumentText');
            getDocumentText.withArgs('ECS.log').returns(emailSession.ecs);
            getDocumentText.withArgs('OCS.log').returns(emailSession.ocs);
            getDocumentText.withArgs('another.log').returns('{gid:"another"}');

            codeNavigator = new CodeNavigator(documentsProvider, new DocumentsCache);
        });

        it('should return gid usages from all available log files', () => {
            const gidReferences = codeNavigator.findAllEntriesForGid('kjPhKGtz2zaCeReGf1Dkqg');
            
            expect(gidReferences).to.have.length.greaterThan(0);
        });
    });

    describe('getDefinition', () => {

        describe('CCS conversion from Office to Pdf', () => {
            let codeNavigator: CodeNavigator;

            beforeEach(() => {
                const documentsProvider = new DocumentsProvider('fake-workspace', null);
                sinon.stub(documentsProvider, 'getDocuments')
                    .returns(_.keys(ccsOfficeToPdfConversionSession));
                const getDocumentText = sinon.stub(documentsProvider, 'getDocumentText');
                _.forEach(ccsOfficeToPdfConversionSession, (text, uri) => getDocumentText.withArgs(uri).returns(text));

                sinon.stub(documentsProvider, 'getUriForRelativePath')
                    .callsFake(filePath => filePath);

                codeNavigator = new CodeNavigator(documentsProvider, new DocumentsCache);
            });

            it('should return null if there is no outcoming request in log entry', () => {
                const logItem = {
                    "name": "ContentConversionService",
                    "hostname": "tootz-document0",
                    "pid": 5552, "taskid": 7506,
                    "gid": "Gd7Ics5NcAygZfeZ4jszbA",
                    "level": 30,
                    "type": "OcsHttpService",
                    "msg": "Begin: convert",
                    "time": "2017-09-20T01:18:44.016Z", "v": 0
                };
                const definition = codeNavigator.getDefinition(logItem);
                expect(definition).is.null;
            });

            it('should return location when log entry describes outcoming request ccs -> ocs', () => {
                const logItem = {
                    "name": "ContentConversionService",
                    "hostname": "tootz-document0",
                    "pid": 5552, "taskid": 7506,
                    "gid": "Gd7Ics5NcAygZfeZ4jszbA",
                    "level": 30,
                    "reqBegin": true,
                    "req": {
                        "method": "POST",
                        "path": "/OCS/convert",
                        "port": 19012,
                        "data": {
                            "src": "C:\\Prizm\\cache\\WorkfileCache\\EEin9flDujxETDq8kQY2Xw\\WorkfileContents.docx",
                            "pageNumber": 0, "password": <string>null, "ignorePageNumber": true,
                            "outputTemplate": "C:\\Prizm\\cache\\ContentConversionCache\\temp\\workflow_DwyVShpxhPDayDB1gc6PrA\\WorkfileContents.docx.pdf"
                        }
                    },
                    "msg": "", "time": "2017-09-20T01:18:44.017Z", "v": 0
                };
                const definition = codeNavigator.getDefinition(logItem);
                expect(definition).eql({
                    uri: 'OfficeConversionService.log',
                    range: {
                        start: { line: 1, character: 0 },
                        end: { line: 1, character: 350 }
                    }
                });
            });

            it('should return location when log entry describes outcoming request ccs -> pdfcs', () => {
                const logItem = {
                    "name": "ContentConversionService",
                    "hostname": "tootz-document0",
                    "pid": 5552, "taskid": 7506,
                    "gid": "Gd7Ics5NcAygZfeZ4jszbA",
                    "level": 30, "reqBegin": true,
                    "req": {
                        "method": "POST",
                        "path": "/PDFCS/documentAttributes",
                        "port": 19004,
                        "data": {
                            "src": "C:\\Prizm\\cache\\ContentConversionCache\\temp\\workflow_DwyVShpxhPDayDB1gc6PrA\\WorkfileContents.docx.pdf",
                            "confidence": 100,
                            "password": <string>null
                        }
                    },
                    "msg": "", "time": "2017-09-20T01:18:44.156Z", "v": 0
                };
                const definition = codeNavigator.getDefinition(logItem);
                expect(definition).eql({
                    uri: 'PDFConversionService.log',
                    range: {
                        start: { line: 1, character: 0 },
                        end: { line: 1, character: 366 }
                    }
                });
            });

            it('should return location when log entry describes incoming request ccs -> ocs', () => {
                const logItem = {
                    "gid": "Gd7Ics5NcAygZfeZ4jszbA",
                    "name": "OCS",
                    "time": "2017-09-20T01:18:44.026Z",
                    "pid": 980, "level": 30, "tid": 3396, "taskid": 9597,
                    "taskBegin": true,
                    "taskName": "Request",
                    "parent": { "name": "ContentConversionService", "pid": 5552, "taskid": 7506 },
                    "reqAccepted": true,
                    "req": { "method": "POST", "port": 19012, "path": "/OCS/convert" }
                };
                const definition = codeNavigator.getDefinition(logItem);
                expect(definition).eql({
                    uri: 'ContentConversionService.log',
                    range: {
                        start: { line: 1, character: 0 },
                        end: { line: 1, character: 554 }
                    }
                });
            });
        });

        describe('PCCIS Session', () => {
            let codeNavigator: CodeNavigator;

            beforeEach(() => {
                const documentsProvider = new DocumentsProvider('fake-workspace', null);
                sinon.stub(documentsProvider, 'getDocuments')
                    .returns(_.keys(pccisSession));
                const getDocumentText = sinon.stub(documentsProvider, 'getDocumentText');
                _.forEach(pccisSession, (text, uri) => getDocumentText.withArgs(uri).returns(text));

                sinon.stub(documentsProvider, 'getUriForRelativePath')
                    .callsFake(filePath => filePath);

                codeNavigator = new CodeNavigator(documentsProvider, new DocumentsCache);
            });

            describe('should return location when log entry describes incoming request pccis -> wfs', () => {
                
                it('for PCCIS log entry', () => {
                    const logItem = {
                        "time": "2018-03-16T14:08:06.770Z",
                        "gid": "dfTpVCC+/s2aq1Vl/V43Aw",
                        "name": "PCCIS",
                        "level": 30, "taskid": 39, "pid": 2332, "tid": 78,
                        "msg": "InternalRequest (WFS)",
                        "reqBegin": true,
                        "req": { "method": "POST", "path": "/PCCIS/V1/WorkFile", "port": 19007 }
                    };
                    const definition = codeNavigator.getDefinition(logItem);
                    expect(definition).eql({
                        uri: 'WorkfileService.log',
                        range: {
                            start: { line: 0, character: 0 },
                            end: { line: 0, character: 428 }
                        }
                    });
                });

                it('for WorkfileService log entry', () => {
                    const logItem = { 
                        "name": "WorkfileService", "hostname": "PTPcanaryUbuntu14CoreWin10ChromeJSP20180375095316316s13205451", 
                        "pid": 2192, "taskid": 33, 
                        "gid": "dfTpVCC+/s2aq1Vl/V43Aw", "level": 30, 
                        "taskBegin": true, 
                        "parent": { "name": "PCCIS", "pid": 2332, "taskid": 39 }, 
                        "reqAccepted": true, 
                        "req": { 
                            "method": "POST", 
                            "path": "/PCCIS/V1/WorkFile?FileExtension=doc&MinSecondsAvailable=88500&ServerCaching=full", 
                            "port": 19007 
                        }, 
                        "msg": "", "time": "2018-03-16T14:08:06.775Z", "v": 0 };
                    const definition = codeNavigator.getDefinition(logItem);
                    expect(definition).eql({
                        uri: 'Pccis0/ImagingServices.log',
                        range: {
                            start: { line: 3, character: 0 },
                            end: { line: 3, character: 263 }
                        }
                    });
                });
            });

            describe('should return location when log entry describes request pccis -> rcs', () => {

                it('for PCCIS log entry', () => {
                    const logItem = { 
                        "time": "2018-03-16T14:08:12.948Z", 
                        "gid": "5LWSCTeH9bzPB7HHGJI03A", 
                        "name": "PCCIS", "level": 30, 
                        "taskid": 59, "pid": 2418, "tid": 121, 
                        "msg": "InternalRequest (RCS)", 
                        "reqBegin": true, 
                        "req": { 
                            "method": "POST", 
                            "path": "/documentAttributes", 
                            "port": 19005 
                        } 
                    };
                    const definition = codeNavigator.getDefinition(logItem);
                    expect(definition).eql({
                        uri: 'RasterConversionService.log',
                        range: {
                            start: { line: 0, character: 0 },
                            end: { line: 0, character: 339 }
                        }
                    });
                });

                it('for RasterConversionService log entry', () => {
                    const logItem = { 
                        "gid": "5LWSCTeH9bzPB7HHGJI03A", 
                        "name": "RCS", "time": "2018-03-16T14:08:12.950Z", 
                        "pid": 2143, "level": 30, "tid": 2147, "taskid": 20, 
                        "taskBegin": true, 
                        "taskName": "Request", 
                        "parent": { 
                            "name": "PCCIS", 
                            "pid": 2418, 
                            "taskid": 59 
                        }, 
                        "reqAccepted": true, 
                        "req": { 
                            "method": "POST", 
                            "port": 19005, 
                            "path": "/RCS/documentAttributes" 
                        } 
                    };
                    const definition = codeNavigator.getDefinition(logItem);
                    expect(definition).eql({
                        uri: 'Pccis2/ImagingServices.log',
                        range: {
                            start: { line: 2, character: 0 },
                            end: { line: 2, character: 265 }
                        }
                    });
                });
            });

            describe('should return location when log entry describes request plb -> pccis', () => {

                it('for LoadBalancer log entry', () => {
                    const logItem = { 
                        "name": "LoadBalancer", 
                        "hostname": "PTPcanaryUbuntu14CoreWin10ChromeJSP20180375095316316s13205451", 
                        "pid": 2562, "taskid": 100, "gid": "MPvux5kbwGfis8K47M9gVA", "level": 30, 
                        "reqBegin": true, 
                        "req": { 
                            "method": "GET", 
                            "url": "http://localhost:19002/PCCIS/V1/Page/q/0/Tile/0/1020/1028/260?DocumentID=ueiLcFo6dudAv59Bifi04Ku7-4_nrtVIGCED5UM8HiM2jSiol0ec9J3qx_1XNh3jU3wVbAIifKhSN06CdOarrRo8VzpiRlsdTV-bJccq-_gikwnvq0GoTIPfD-6PyOtj_i8PUHtRee3NI-iwBFZCrhA&Scale=1&ContentType=png&Quality=100" 
                        }, 
                        "msg": "", 
                        "time": "2018-03-16T14:08:13.470Z", "v": 0 
                    };
                    const definition = codeNavigator.getDefinition(logItem);
                    expect(definition).eql({
                        uri: 'Pccis2/ImagingServices.log',
                        range: {
                            start: { line: 6, character: 0 },
                            end: { line: 6, character: 364 }
                        }
                    });
                });

                it('for PCCIS log entry', () => {
                    const logItem = { 
                        "time": "2018-03-16T14:08:13.471Z", "gid": "MPvux5kbwGfis8K47M9gVA", 
                        "name": "PCCIS", "level": 30, "taskid": 66, "pid": 2418, "tid": 87, 
                        "msg": "ProcessRequest", 
                        "taskBegin": true, 
                        "parent": { 
                            "name": "LoadBalancer", 
                            "pid": 2562, 
                            "taskid": 100 
                        }, 
                        "reqAccepted": true, 
                        "req": { 
                            "method": "GET", 
                            "path": "/PCCIS/V1/Page/q/0/Tile/0/1020/1028/260", 
                            "port": 19002 
                        } 
                    };
                    const definition = codeNavigator.getDefinition(logItem);
                    expect(definition).eql({
                        uri: 'plb.sep_single.log',
                        range: {
                            start: { line: 3, character: 0 },
                            end: { line: 3, character: 549 }
                        }
                    });
                });
            });

            describe('should return location when log entry describes request pas -> plb -> pccis', () => {

                it('for LoadBalancer log entry', () => {
                    const logItem = { 
                        "name": "LoadBalancer", 
                        "hostname": "PTPcanaryUbuntu14CoreWin10ChromeJSP20180375095316316s13205451", 
                        "pid": 2562, "taskid": 100, 
                        "gid": "MPvux5kbwGfis8K47M9gVA", "level": 30, 
                        "taskBegin": true, 
                        "parent": { 
                            "name": "PAS", 
                            "pid": 3353, 
                            "taskid": 22 
                        }, 
                        "reqAccepted": true, 
                        "req": { 
                            "method": "GET", 
                            "path": "/PCCIS/V1/Page/q/0/Tile/0/1020/1028/260?DocumentID=ueiLcFo6dudAv59Bifi04Ku7-4_nrtVIGCED5UM8HiM2jSiol0ec9J3qx_1XNh3jU3wVbAIifKhSN06CdOarrRo8VzpiRlsdTV-bJccq-_gikwnvq0GoTIPfD-6PyOtj_i8PUHtRee3NI-iwBFZCrhA&Scale=1&Quality=100&ContentType=png", 
                            "port": 3000 
                        }, 
                        "msg": "", "time": "2018-03-16T14:08:13.470Z", "v": 0 
                    };
                    const definition = codeNavigator.getDefinition(logItem);
                    expect(definition).eql({
                        uri: 'pas/pas-1.log',
                        range: {
                            start: { line: 1, character: 0 },
                            end: { line: 1, character: 639 }
                        }
                    });
                });

                it('for PAS log entry', () => {
                    const logItem = { 
                        "name": "PAS", 
                        "hostname": "PTPcanaryUbuntu14CoreWin10ChromeJSP20180375095316316s13205451", 
                        "pid": 3353, "taskid": 22, "gid": "MPvux5kbwGfis8K47M9gVA", "level": 30, 
                        "reqBegin": true, "operation": "proxyToPccis", 
                        "req": { 
                            "method": "GET", 
                            "baseUrl": "http://localhost:18681", 
                            "path": "/PCCIS/V1/Page/q/0/Tile/0/1020/1028/260", 
                            "qs": { "DocumentID": "ueiLcFo6dudAv59Bifi04Ku7-4_nrtVIGCED5UM8HiM2jSiol0ec9J3qx_1XNh3jU3wVbAIifKhSN06CdOarrRo8VzpiRlsdTV-bJccq-_gikwnvq0GoTIPfD-6PyOtj_i8PUHtRee3NI-iwBFZCrhA", "Scale": "1", "Quality": "100", "ContentType": "png" } 
                        }, 
                        "timeline": "start", "msg": "", "time": "2018-03-16T14:08:13.469Z", "v": 0 
                    };
                    const definition = codeNavigator.getDefinition(logItem);
                    expect(definition).eql({
                        uri: 'Pccis2/ImagingServices.log',
                        range: {
                            start: { line: 6, character: 0 },
                            end: { line: 6, character: 364 }
                        }
                    });
                });
            });
        });

        describe('PLB calls CCS conversion', () => {
            let codeNavigator: CodeNavigator;

            beforeEach(() => {
                const documentsProvider = new DocumentsProvider('fake-workspace', null);
                sinon.stub(documentsProvider, 'getDocuments')
                    .returns(_.keys(plbToCcsSession));
                const getDocumentText = sinon.stub(documentsProvider, 'getDocumentText');
                _.forEach(plbToCcsSession, (text, uri) => getDocumentText.withArgs(uri).returns(text));

                sinon.stub(documentsProvider, 'getUriForRelativePath')
                    .callsFake(filePath => filePath);

                codeNavigator = new CodeNavigator(documentsProvider, new DocumentsCache);
            });

            it('for LoadBalancer log entry', () => {
                const logItem = { 
                    "name": "LoadBalancer", 
                    "hostname": "PTPratnightcentos7pasbackcompatprizmdocs13205302c13201396305", 
                    "pid": 10152, "taskid": 3636, "gid": "q9JrgH8xpqrPSyqdyBmwQA", "level": 30, 
                    "reqBegin": true, "req": { "method": "POST", "url": "http://127.0.0.1:19010/v2/contentConverters" }, "msg": "", 
                    "time": "2018-03-03T05:37:41.757Z", 
                    "v": 0 };
                const definition = codeNavigator.getDefinition(logItem);
                expect(definition).eql({
                    uri: 'ContentConversionService.log',
                    range: {
                        start: { line: 0, character: 0 },
                        end: { line: 0, character: 386 }
                    }
                });
            });
        });
    });

    describe('getTasksFromTheLogFile', () => {
        let codeNavigator: CodeNavigator;
        let documentsCache: DocumentsCache;
        let cacheSetSpy: sinon.SinonSpy;

        beforeEach(() => {
            const documentsProvider = new DocumentsProvider(null, null);
            sinon.stub(documentsProvider, 'getDocuments')
                .returns([
                    'ECS.log',
                    'OCS.log'
                ]);
            const getDocumentText = sinon.stub(documentsProvider, 'getDocumentText');
            getDocumentText.withArgs('ECS.log').returns(emailSession.ecs);
            getDocumentText.withArgs('OCS.log').returns(emailSession.ocs);

            documentsCache = new DocumentsCache();
            cacheSetSpy = sinon.spy(documentsCache, 'set');

            codeNavigator = new CodeNavigator(documentsProvider, documentsCache);
        });

        it('should return tasks from the log file', () => {
            const logText = emailSession.ecs;
            const logLines = parseTextLog(logText);

            const tasks = codeNavigator.getTasksFromTheLogFile('ECS.log');

            expect(tasks).eql([
                {
                    taskBegin: logLines[2],
                    taskEnd: logLines[8]
                },
                {
                    taskBegin: logLines[10],
                    taskEnd: null
                }
            ]);
        });

        it('should update documents cache with tasks have been found', () => {
            codeNavigator.getTasksFromTheLogFile('ECS.log');

            expect(cacheSetSpy.calledWithMatch('ECS.log', { tasks: sinon.match.array }))
                .to.be.true;
        });

        describe('when cache has tasks for uri', () => {

            beforeEach(() => {
                const logText = emailSession.ecs;
                const logLines = parseTextLog(logText);

                documentsCache.set('ECS.log', {
                    tasks: [
                        {
                            taskBegin: logLines[1],
                            taskEnd: logLines[2]
                        }
                    ]
                })
            });

            it('should return result from cache', () => {
                const logText = emailSession.ecs;
                const logLines = parseTextLog(logText);

                const tasks = codeNavigator.getTasksFromTheLogFile('ECS.log');

                expect(tasks).eql([
                    {
                        taskBegin: logLines[1],
                        taskEnd: logLines[2]
                    }
                ]);
            });
        });
    });

    describe('getOperationsLongerThan', () => {
        let codeNavigator: CodeNavigator;
        let documentsCache: DocumentsCache;
        let cacheSetSpy: sinon.SinonSpy;

        beforeEach(() => {
            const documentsProvider = new DocumentsProvider(null, null);
            sinon.stub(documentsProvider, 'getDocuments')
                .returns([
                    'OCS.log'
                ]);
            const getDocumentText = sinon.stub(documentsProvider, 'getDocumentText');
            getDocumentText.withArgs('OCS.log').returns(emailSession.ocs);

            documentsCache = new DocumentsCache();
            cacheSetSpy = sinon.spy(documentsCache, 'set');

            codeNavigator = new CodeNavigator(documentsProvider, documentsCache);
        });

        it('should return operations longer than minDuration (ms)', () => {
            const logText = emailSession.ocs;
            const logLines = parseTextLog(logText);
            
            const operations = codeNavigator.getOperationsLongerThan('OCS.log', 100);
            expect(operations).eql([
                {
                    logLine: logLines[2],
                    durationMs: 169
                }
            ])
        });

        it('should update documents cache with operations have been found', () => {
            codeNavigator.getOperationsLongerThan('OCS.log', 100);

            expect(cacheSetSpy.calledWithMatch('OCS.log', { longOperations: sinon.match.array }))
                .to.be.true;
        });

        describe('when cache has long operations for uri', () => {

            beforeEach(() => {
                const logText = emailSession.ecs;
                const logLines = parseTextLog(logText);

                documentsCache.set('OCS.log', {
                    longOperations: [{ logLine: logLines[1], durationMs: 321 }]
                });
            });

            it('should return result from cache', () => {
                const logText = emailSession.ecs;
                const logLines = parseTextLog(logText);

                const operations = codeNavigator.getOperationsLongerThan('OCS.log', 100);

                expect(operations).eql([
                    {
                        logLine: logLines[1], 
                        durationMs: 321
                    }
                ]);
            });
        });
    });
});