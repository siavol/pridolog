import * as _ from 'lodash'

export interface IPrizmDocService {
    name: string;
    logFile: string | RegExp;
    requestPath?: RegExp;
}

const serviceDescriptions = {
    autoRedaction: {
        name: 'ARS',
        logFile: 'AutoRedactionService.log',
        requestPath: /\/ECS\/.*/i
    },
    configNormalizer: {
        name: 'config-normalizer',
        logFile: 'config-normalizer.log'
    },
    configurationService: {
        name: 'configuration-service',
        logFile: 'configuration-service.log',
        requestPath: /\/CONF\/.*/i
    },
    contentConversionService: {
        name: 'ContentConversionService',
        logFile: 'ContentConversionService.log',
        requestPath: /\/v2\/((service\/health)|(contentConverters.*))/i
    },
    documentConversionService: {
        name: 'document-conversion-service',
        logFile: 'document-conversion-service.log',
        requestPath: /\/document-conversion-service\/.*/i
    },
    emailConversionService: {
        name: 'ECS',
        logFile: 'EmailConversionService.log',
        requestPath: /\/ECS\/.*/i
    },
    emailProcessingService: {
        name: 'EPS',
        logFile: 'EmailProcessingService.log',
        requestPath: /\/EPS\/.*/i
    },
    errorReportingService: {
        name: 'ERS',
        logFile: 'ErrorReportingService.log',
        requestPath: /\/ERS\/.*/i
    },
    formatDetectionService: {
        name: 'FDS',
        logFile: 'FormatDetectionService.log',
        requestPath: /\/FDS\/.*/i
    },
    formExtractionService: {
        name: 'form-extraction-service',
        logFile: 'form-extraction-service.log',
        requestPath: /\/v2\/formExtractors.*/
    },
    healthService: {
        name: 'health-service',
        logFile: 'health-service.log'
    },
    htmlConversionService: {
        name: 'HTMLCS',
        logFile: 'HTMLConversionService.log',
        requestPath: /\/HTMLCS\/.*/i
    },
    licensingService: {
        name: 'licensing-service',
        logFile: 'licensing-service.log',
        requestPath: /\/LIC\/.*/i
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
        requestPath: /\/OCS\/.*/i
    },
    pccErrors: {
        name: 'pcc-errors', // this service does not log its name
        logFile: 'PccErrors.log'
    },
    pdfConversionService: {
        name: 'PDFCS',
        logFile: 'PDFConversionService.log',
        requestPath: /\/PDFCS\/.*/i
    },
    pdfProcessingService: {
        name: 'PDFPS',
        logFile: 'PDFProcessingService.log',
        requestPath: /\/PDFPS\/.*/i
    },
    processStateService: {
        name: 'process-state-service',
        logFile: 'process-state-service.log'
    },
    rasterConversionService: {
        name: 'RCS',
        logFile: 'RasterConversionService.log',
        requestPath: /\/RCS\/.*/i
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
        logFile: 'text-service.log',
        requestPath: /\/v2\/searchContexts.*/i
    },
    vectorConversionService: {
        name: 'VCS',
        logFile: 'VectorConversionService.log',
        requestPath: /\/VCS\/.*/i
    },
    watchdog: {
        name: 'WATCHDOG',
        logFile: 'watchdog.log'
    },
    workfileService: {
        name: 'WorkfileService',
        logFile: 'WorkfileService.log',
        requestPath: /\/PCCIS\/v1\/((WorkFile.*)|(Private\/(makeContentsAvailable|getWorkFileInfo|makeWorkFileContentsAvailable|extendExpirationDateTime))|(Service\/Current\/(Info|Health)))/i
    },
    pccis: {
        name: 'PCCIS',
        logFile: /Pccis\d+\/.*/i,
        requestPath: /\/PCCIS\/V1\/(Page|Document|ViewingSession).*/i
    },
    loadBalancer: {
        name: 'LoadBalancer',
        logFile: 'plb.sep_single.log'
    },
    pas: {
        name: 'PAS',
        logFile: /pas\/pas-\d+.log/i
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