import * as _ from 'lodash'

export interface IPrizmDocService {
    name: string;
    logFile: string;
    requestPath?: RegExp;
}

const serviceDescriptions = {
    autoRedaction: {
        name: 'ARS',
        logFile: 'AutoRedactionService.log',
        requestPath: /\/ECS\/.*/
    },
    configNormalizer: {
        name: 'config-normalizer',
        logFile: 'config-normalizer.log'
    },
    configurationService: {
        name: 'configuration-service',
        logFile: 'configuration-service.log',
        requestPath: /\/CONF\/.*/
    },
    contentConversionService: {
        name: 'ContentConversionService',
        logFile: 'ContentConversionService.log'
    },
    documentConversionService: {
        name: 'document-conversion-service',
        logFile: 'document-conversion-service.log',
        requestPath: /\/document-conversion-service\/.*/
    },
    emailConversionService: {
        name: 'ECS',
        logFile: 'EmailConversionService.log'
    },
    emailProcessingService: {
        name: 'EPS',
        logFile: 'EmailProcessingService.log'
    },
    errorReportingService: {
        name: 'ERS',
        logFile: 'ErrorReportingService.log'
    },
    formatDetectionService: {
        name: 'FDS',
        logFile: 'FormatDetectionService.log',
        requestPath: /\/FDS\/.*/
    },
    formExtractionService: {
        name: 'form-extraction-service',
        logFile: 'form-extraction-service.log'
    },
    healthService: {
        name: 'health-service',
        logFile: 'health-service.log'
    },
    htmlConversionService: {
        name: 'HTMLCS',
        logFile: 'HTMLConversionService.log'
    },
    licensingService: {
        name: 'licensing-service',
        logFile: 'licensing-service.log',
        requestPath: /\/LIC\/.*/
    },
    mongoManagerService: {
        name: 'mongo-manager-service',
        logFile: 'mongo-manager-service.log'
    },
    msOfficeConversionService: {
        name: 'MSOCS',
        logFile: 'ms-office-conversion-service.log'
    },
    officeConversionService: {
        name: 'OCS',
        logFile: 'OfficeConversionService.log',
        requestPath: /\/OCS\/.*/
    },
    pccErrors: {
        name: 'pcc-errors', // this service does not log its name
        logFile: 'PccErrors.log'
    },
    pdfConversionService: {
        name: 'PDFCS',
        logFile: 'PDFConversionService.log',
        requestPath: /\/PDFCS\/.*/
    },
    pdfProcessingService: {
        name: 'PDFPS',
        logFile: 'PDFProcessingService.log',
        requestPath: /\/PDFPS\/.*/
    },
    processStateService: {
        name: 'process-state-service',
        logFile: 'process-state-service.log'
    },
    rasterConversionService: {
        name: 'RCS',
        logFile: 'RasterConversionService.log'
    },
    rasterFormExtractionService: {
        name: 'raster-form-extraction-service',
        logFile: 'raster-form-extraction-service.log'
    },
    redactionService: {
        name: 'RedactionService',
        logFile: 'RedactionService.log'
    },
    textService: {
        name: 'text-service',
        logFile: 'text-service.log'
    },
    vectorConversionService: {
        name: 'VCS',
        logFile: 'VectorConversionService.log'
    },
    watchdog: {
        name: 'WATCHDOG',
        logFile: 'watchdog.log'
    },
    workfileService: {
        name: 'WorkfileService',
        logFile: 'WorkfileService.log'
    }
};

type ServiceName = keyof typeof serviceDescriptions;

type IServiceDescriptions = {
    [P in ServiceName]: IPrizmDocService;
}

export const services = Object.freeze(serviceDescriptions);

export function getServiceByRequestPath(path: string) {
    return _(<IServiceDescriptions>serviceDescriptions)
        .values()
        .find(s => s.requestPath && s.requestPath.test(path));
}