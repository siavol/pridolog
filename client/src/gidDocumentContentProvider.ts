import * as path from 'path';
import * as vscode from 'vscode';
import * as _ from 'lodash';

import { ILogItem } from '../../common/logItemInterfaces'

export class GidDocumentContentProvider implements vscode.TextDocumentContentProvider {

    public static scheme = 'pridolog-gid';

    // onDidChange?: vscode.Event<vscode.Uri>;

    public provideTextDocumentContent(uri: vscode.Uri, _token: vscode.CancellationToken): vscode.ProviderResult<string> {
        const gid = decodeGid(uri);

        return vscode.commands.executeCommand('pridolog.server.getLogItemsForGid', gid)
            .then((logItems: ILogItem[]) => {

                const browserPath = path.join(__dirname, '../../browser');
                const orderedLogItems = _.orderBy(logItems, ['logItem.time', 'line']);
                var data = {
                    workspacePath: vscode.workspace.workspaceFolders[0].uri.fsPath,
                    gid, 
                    logItems: orderedLogItems
                };

                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <script src="${path.resolve(__dirname, browserPath, './gidDocument.js')}"></script>
                        <script>
                            var data = ${JSON.stringify(data)};
                            gidDocument.renderData(data);
                        </script>
                    </head>
                    <body>
                        <div id="root"></div>
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