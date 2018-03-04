import * as sinon from 'sinon'
import { expect } from 'chai'
import * as _ from 'lodash'

import { DocumentsProvider } from '../src/documentsProvider'
import { CodeNavigator } from '../src/codeNavigator'
import { parseTextLog } from '../src/textLog'
import { emailSession, ccsOfficeToPdfConversionSession } from './testLogs'

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

            codeNavigator = new CodeNavigator(documentsProvider);
        });

        it('should return gid usages from all available log files', () => {
            const gidReferences = codeNavigator.findAllEntriesForGid('kjPhKGtz2zaCeReGf1Dkqg');
            
            expect(gidReferences).to.have.length.greaterThan(0);
        });
    });

    describe('getDefinition', () => {

        let codeNavigator: CodeNavigator;

        beforeEach(() => {
            const documentsProvider = new DocumentsProvider('fake-workspace', null);
            sinon.stub(documentsProvider, 'getDocuments')
                .returns(_.keys(ccsOfficeToPdfConversionSession));
            const getDocumentText = sinon.stub(documentsProvider, 'getDocumentText');
            _.forEach(ccsOfficeToPdfConversionSession, (text, uri) => getDocumentText.withArgs(uri).returns(text));

            sinon.stub(documentsProvider, 'getUriForRelativePath')
                .callsFake(filePath => filePath);

            codeNavigator = new CodeNavigator(documentsProvider);
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
                "time": "2017-09-20T01:18:44.016Z", "v": 0 };
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
                "msg": "", "time": "2017-09-20T01:18:44.017Z", "v": 0 };
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
                "msg": "", "time": "2017-09-20T01:18:44.156Z", "v": 0 };
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

    describe('getTasksFromTheLogFile', () => {
        let codeNavigator: CodeNavigator;

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

            codeNavigator = new CodeNavigator(documentsProvider);
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
    });

    describe('getOperationsLongerThan', () => {
        let codeNavigator: CodeNavigator;

        beforeEach(() => {
            const documentsProvider = new DocumentsProvider(null, null);
            sinon.stub(documentsProvider, 'getDocuments')
                .returns([
                    'OCS.log'
                ]);
            const getDocumentText = sinon.stub(documentsProvider, 'getDocumentText');
            getDocumentText.withArgs('OCS.log').returns(emailSession.ocs);

            codeNavigator = new CodeNavigator(documentsProvider);
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
    });
});