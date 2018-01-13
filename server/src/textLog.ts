export function getTextLines(text: string): string[] {
    if (!text) {
        return [];
    }
    return text.split(/\r?\n/g);
}

export interface IParsingError {
    line: number;
    error: SyntaxError;
}

export interface ILogLine { 
    line: number;
    source: string;
    logItem: any;
}

export function parseTextLog(text: string, errHandler?: (err: IParsingError) => any): ILogLine[] {
    let logItems: ILogLine[] = [];
    getTextLines(text)
        .forEach((source, index) => {
            try {
                const logItem = JSON.parse(source);
                logItems.push({
                    line: index,
                    source: source,
                    logItem: logItem
                });
            } catch (err) {
                if (errHandler) {
                    errHandler({
                        line: index,
                        error: err
                    });
                }
            }
        });
    return logItems;
}