import * as path from 'path';
import * as vscode from 'vscode';
// import * as _ from 'lodash';

interface ILogItem {
    uri: string;
    line: number;
    logItem: any;
}

export class GidDocumentContentProvider implements vscode.TextDocumentContentProvider {

    public static scheme = 'pridolog-gid';

    // onDidChange?: vscode.Event<vscode.Uri>;

    public provideTextDocumentContent(uri: vscode.Uri, _token: vscode.CancellationToken): vscode.ProviderResult<string> {
        const gid = decodeGid(uri);

        return vscode.commands.executeCommand('pridolog.server.getLogItemsForGid', gid)
            .then((logItems: ILogItem[]) => {

                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <link rel="stylesheet" href="${path.join(__dirname, '../../node_modules/highlight.js/styles', 'default.css')}">
                        <script src="${path.join(__dirname, '../../node_modules/highlight.js/lib/highlight.js')}"></script>
                        <script>hljs.initHighlightingOnLoad();</script>
                    </head>
                    <body>
                        <h1>gid report for <b>${gid}</b></h1>
                        <div>
                        ${logItems.map(this.getLogItemHtml).join('\n')}
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

    private getLogItemHtml(item: ILogItem): string {
        return `<pre>${JSON.stringify(item.logItem)}</pre>`
    }
}

export function encodeGid(gid: string) {
    return vscode.Uri.parse(`${GidDocumentContentProvider.scheme}:gid?${gid}`);
}

export function decodeGid(uri: vscode.Uri): string {
    return uri.query;
}