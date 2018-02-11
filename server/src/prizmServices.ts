import * as _ from 'lodash'

export interface IPrizmDocService {
    logFile: string;
    apiPrefix?: string;
}

const serviceDescriptions = {
    autoRedaction: {
        logFile: 'AutoRedactionService.log'
    },
    configNormalizer: {
        logFile: 'config-normalizer.log'
    },
    configurationService: {
        logFile: 'configuration-service.log'
    },
    contentConversionService: {
        logFile: 'ContentConversionService.log'
    },
    documentConversionService: {
        logFile: 'document-conversion-service.log'
    },
    emailConversionService: {
        logFile: 'EmailConversionService.log'
    },
    emailProcessingService: {
        logFile: 'EmailProcessingService.log'
    },
    errorReportingService: {
        logFile: 'ErrorReportingService.log'
    },
    formatDetectionService: {
        logFile: 'FormatDetectionService.log'
    },
    formExtractionService: {
        logFile: 'form-extraction-service.log'
    },
    healthService: {
        logFile: 'health-service.log'
    },
    htmlConversionService: {
        logFile: 'HTMLConversionService.log'
    },
    licensingService: {
        logFile: 'licensing-service.log'
    },
    mongoManagerService: {
        logFile: 'mongo-manager-service.log'
    },
    msOfficeConversionService: {
        logFile: 'ms-office-conversion-service.log'
    },
    officeConversionService: {
        logFile: 'OfficeConversionService.log',
        apiPrefix: 'OCS'
    },
    pccErrors: {
        logFile: 'PccErrors.log'
    },
    pdfConversionService: {
        logFile: 'PDFConversionService.log',
        apiPrefix: 'PDFCS'
    },
    pdfProcessingService: {
        logFile: 'PDFProcessingService.log'
    },
    processStateService: {
        logFile: 'process-state-service.log'
    },
    rasterConversionService: {
        logFile: 'RasterConversionService.log'
    },
    rasterFormExtractionService: {
        logFile: 'raster-form-extraction-service.log'
    },
    redactionService: {
        logFile: 'RedactionService.log'
    },
    textService: {
        logFile: 'text-service.log'
    },
    vectorConversionService: {
        logFile: 'VectorConversionService.log'
    },
    watchdog: {
        logFile: 'watchdog.log'
    },
    workfileService: {
        logFile: 'WorkfileService.log'
    }
};

type ServiceName = keyof typeof serviceDescriptions;

type IServiceDescriptions = {
    [P in ServiceName]: IPrizmDocService;
}

export const services = Object.freeze(serviceDescriptions);

export function getServiceByApiPrefix(apiPrefix: string) {
    const entry = _(<IServiceDescriptions>serviceDescriptions)
        .entries()
        .find((e) => e[1].apiPrefix === apiPrefix);
    return entry 
        ? _.extend(_.clone(entry[1]), {name: entry[0]})
        : null;
}