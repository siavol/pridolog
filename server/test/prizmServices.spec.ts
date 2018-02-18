import { expect } from 'chai'

import { getServiceByRequestPath } from '../src/prizmServices'

describe('prizmServices', () => {

    describe('getServiceByApiPrefix', () => {

        [
            { requestPath: '/OCS/convert', service: 'OCS' }
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