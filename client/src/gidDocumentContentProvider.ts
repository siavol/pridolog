import * as path from 'path';
import * as vscode from 'vscode';
import * as _ from 'lodash';

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

                let tableHtml = '';
                let itemsToProcess = logItems;
                while (itemsToProcess.length > 0) {
                    let lastUri: string = undefined;
                    const itemsChain = _(itemsToProcess)
                        .takeWhile(item => {
                            const result = lastUri === undefined || lastUri === item.uri;
                            lastUri = item.uri;                        
                            return result;
                        })
                        .value();

                    const filePath = path.relative(
                        vscode.workspace.workspaceFolders[0].uri.fsPath,
                        itemsChain[0].uri.replace('file://', ''));
                    tableHtml += `<tr><td colSpan="3"><h2>${filePath}</h2></td></tr>\n`;

                    itemsChain.forEach(item => {
                        tableHtml += this.getLogItemHtml(item) + '\n';
                    });

                    itemsToProcess = _.drop(itemsToProcess, itemsChain.length);
                }

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
                            <table>
                            ${tableHtml}
                            </table>
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
        const openParameters = 
            decodeURI(item.uri);
        /*[
            decodeURI(item.uri),
            {
                selection: new vscode.Range(
                    new vscode.Position(item.line, 0),
                    new vscode.Position(item.line, 10)
                )
            }
        ];*/
        const goToSourceHref = encodeURI(`command:vscode.open?${openParameters}`);
        return `<tr>
                    <td><a href="${goToSourceHref}">${item.line}:</a></td>
                    <td>${item.logItem.time}</td>
                    <td>${JSON.stringify(item.logItem)}</td>
                </tr>`
    }
}

export function encodeGid(gid: string) {
    return vscode.Uri.parse(`${GidDocumentContentProvider.scheme}:gid?${gid}`);
}

export function decodeGid(uri: vscode.Uri): string {
    return uri.query;
}