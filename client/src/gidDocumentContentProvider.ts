import * as vscode from 'vscode';

interface ILogItem {
    uri: string;
    line: number;
    logItem: any;
}

export class GidDocumentContentProvider implements vscode.TextDocumentContentProvider {

    public static scheme = 'pridolog-gid';

    // onDidChange?: vscode.Event<vscode.Uri>;

    provideTextDocumentContent(uri: vscode.Uri, _token: vscode.CancellationToken): vscode.ProviderResult<string> {
        const gid = decodeGid(uri);

        return vscode.commands.executeCommand('pridolog.server.getLogItemsForGid', gid)
            .then((logItems: ILogItem[]) => {
                return `<!DOCTYPE html>
                    <html lang="en">
                    <head></head>
                    <body>
                        <h1>GID REPORT for</h1> <b>${gid}</b>
                        <div>
                        ${logItems.map(item => `<p>${JSON.stringify(item.logItem)}</p>`).join('\n')}
                        </div>
                    </body>`;
            }, rejectedReason => {
                return `<!DOCTYPE html>
                    <html lang="en">
                    <head></head>
                    <body>
                    <h1>Operation rejected:</h1> 
                    ${rejectedReason}`;
            });
    }
}

export function encodeGid(gid: string) {
    return vscode.Uri.parse(`${GidDocumentContentProvider.scheme}:gid?${gid}`);
}

export function decodeGid(uri: vscode.Uri): string {
    return uri.query;
}