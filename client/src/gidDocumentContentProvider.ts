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
                let itemsToProcess = _.orderBy(logItems, ['logItem.time', 'line']);

                let startTime: number = null;
                if (itemsToProcess.length) {
                    startTime = Date.parse(itemsToProcess[0].logItem.time);
                }

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
                        decodeURI(itemsChain[0].uri).replace('file://', ''));
                    tableHtml += `<tr><td colSpan="3"><h2>${filePath}</h2></td></tr>\n`;

                    itemsChain.forEach(item => {
                        tableHtml += this.getLogItemHtml(item, startTime) + '\n';
                    });

                    itemsToProcess = _.drop(itemsToProcess, itemsChain.length);
                }

                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <script src="${path.join(__dirname, '../../node_modules/jquery/dist/jquery.min.js')}"></script>
                        <link rel="stylesheet" href="${path.join(__dirname, '../../node_modules/highlight.js/styles', 'default.css')}">
                        <script src="${path.join(__dirname, '../../node_modules/highlight.js/lib/highlight.js')}"></script>
                        <script>hljs.initHighlightingOnLoad();</script>
                        <script>
    $(function() {
        $("button.plus").click(function(e) {
            var parent = $(e.target).parent().parent();
            var logItemPre = parent.find("pre.log-item");
            var logItem = JSON.parse(logItemPre.text());
            var logItemExpanded = JSON.stringify(logItem, undefined, 2);
            logItemPre.text(logItemExpanded);

            parent.toggleClass("expanded");
            $(e.target).text("-");
        });
    });
                        </script>
                    </head>
                    <body>
                        <h1>gid report for <b>${gid}</b></h1>
                        <div>
                            Started at ${startTime}
                        </div>
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

    private getLogItemHtml(item: ILogItem, startTime: number): string {
        const openParameters = {
            uri: item.uri,
            line: item.line
        };
        const logTime = Date.parse(item.logItem.time);
        const timeShift = logTime - startTime;
        const goToSourceHref = encodeURI(`command:pridolog.open?${JSON.stringify(openParameters)}`);
        return `<tr>
                    <td><button class="plus">+</button></td>
                    <td><a href="${goToSourceHref}"><pre>${item.line}:</pre></a></td>
                    <td>+${timeShift} ms</td>
                    <td><pre class="log-item">${JSON.stringify(item.logItem)}</pre></td>
                </tr>`
    }
}

export function encodeGid(gid: string) {
    return vscode.Uri.parse(`${GidDocumentContentProvider.scheme}:gid?${gid}`);
}

export function decodeGid(uri: vscode.Uri): string {
    return uri.query;
}