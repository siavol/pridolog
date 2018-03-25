import { expect } from 'chai'

import { getServiceByRequestPath } from '../src/prizmServices'

describe('prizmServices', () => {

    describe('getServiceByApiPrefix', () => {

        [
            { requestPath: '/OCS/convert', service: 'OCS' },

            { requestPath: '/PCCIS/V1/WorkFile', service: 'WorkfileService' },
            { requestPath: '/PCCIS/V1/WorkFile/fileId', service: 'WorkfileService' },
            { requestPath: '/PCCIS/V1/Private/makeContentsAvailable', service: 'WorkfileService' },
            { requestPath: '/PCCIS/V1/Private/getWorkFileInfo', service: 'WorkfileService' },
            { requestPath: '/PCCIS/V1/Private/makeWorkFileContentsAvailable', service: 'WorkfileService' },
            { requestPath: '/PCCIS/V1/Private/extendExpirationDateTime', service: 'WorkfileService' },
            
            { requestPath: '/v2/service/health', service: 'ContentConversionService' },
            { requestPath: '/v2/contentConverters', service: 'ContentConversionService' },
            { requestPath: '/v2/contentConverters/processId', service: 'ContentConversionService' },

            { requestPath: '/PCCIS/V1/Page/q/0/Tile/0/1020/1028/260', service: 'PCCIS' },
            { requestPath: '/PCCIS/V1/ViewingSession', service: 'PCCIS' },
            { requestPath: '/PCCIS/V1/Document/q/Attributes', service: 'PCCIS'}
        ].forEach(testCase => it(`should return ${testCase.service} service info for ${testCase.requestPath}`, () => {
            const ocsService = getServiceByRequestPath(testCase.requestPath);
            expect(ocsService).exist;
            expect(ocsService.name).eql(testCase.service);
        }));
        

        it('should return null for not existing API prefix', () => {
            expect(getServiceByRequestPath('NONE')).is.undefined;
        });
    });
})