import { expect } from 'chai'

import { getServiceByApiPrefix } from '../src/prizmServices'

describe('prizmServices', () => {

    describe('getServiceByApiPrefix', () => {

        it('should return service info with it has API prefix specified', () => {
            const ocsService = getServiceByApiPrefix('OCS');
            expect(ocsService).eql({
                name: 'officeConversionService',
                logFile: 'OfficeConversionService.log',
                apiPrefix: 'OCS'
            });
        });

        it('should return null for not existing API prefix', () => {
            expect(getServiceByApiPrefix('NONE')).is.null;
        });
    });
})