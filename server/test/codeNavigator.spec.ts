import * as sinon from 'sinon'
import { expect } from 'chai'

import { DocumentsProvider } from '../src/documentsProvider'
import { CodeNavigator } from '../src/codeNavigator'
import { emailSession } from './testLogs'

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
});