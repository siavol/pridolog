import { expect } from 'chai'
import * as mockfs from 'mock-fs'
import { DocumentsProvider } from '../src/documentsProvider'

describe('DocumentsProvider', () => {

    describe('getDocuments', () => {
        let documentsProvider: DocumentsProvider;

        beforeEach(() => {
            mockfs({
                'path/to/workspace': {
                    'Pccis0': {
                        'ImagingServices.log': 'PCCIS instance 0 log'
                    },
                    'Pccis1': {
                        'ImagingServices.log': 'PCCIS instance 1 log'
                    },
                    'some-text.txt': 'some text file',
                    'ContentConversionService.log': 'CCS log',
                    'PDFConversionService.log': 'PDFCS log'
                }
            });

            documentsProvider = new DocumentsProvider('path/to/workspace', null);
        });

        afterEach(() => {
            mockfs.restore();
        });

        it('should return log files', () => {
            const files = documentsProvider.getDocuments();
            expect(files).to.eql([
                'file:///D:/mycode/pridolog/path/to/workspace/ContentConversionService.log',
                'file:///D:/mycode/pridolog/path/to/workspace/PDFConversionService.log',
                'file:///D:/mycode/pridolog/path/to/workspace/Pccis0/ImagingServices.log',
                'file:///D:/mycode/pridolog/path/to/workspace/Pccis1/ImagingServices.log'
            ]);
        });
    });
});