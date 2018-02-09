import * as sinon from 'sinon'
import { expect } from 'chai'
import * as _ from 'lodash'

import { DocumentsProvider } from '../src/documentsProvider'
import { CodeNavigator } from '../src/codeNavigator'
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

        it('should return location when ccs calls ocs', () => {
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
    });
});