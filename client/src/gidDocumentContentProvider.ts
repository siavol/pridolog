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

                const browserPath = path.join(__dirname, '../../browser');
                const documentFileLinks = [
                    './gid-document.js',
                    './grouped-log-items.js'
                ].map(file => `<script src="${path.join(browserPath, 'src', file)}"></script>`);

                const orderedLogItems = _.orderBy(logItems, ['logItem.time', 'line']);
                var data = {
                    workspacePath: vscode.workspace.workspaceFolders[0].uri.fsPath,
                    gid, 
                    logItems: orderedLogItems
                };

                return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <script src="${path.join(browserPath, './node_modules/react/umd/react.development.js')}"></script>
                        <script src="${path.join(browserPath, './node_modules/react-dom/umd/react-dom.development.js')}"></script>

                        <script src="${path.join(browserPath, './node_modules/lodash/lodash.min.js')}"></script>

                        <script src="${path.join(browserPath, './node_modules/highlight.js/lib/highlight.js')}"></script>
                        <script>
                            // hack to load node module with json language
                            var module = {};
                        </script>
                        <script src="${path.join(browserPath, './node_modules/highlight.js/lib/languages/json.js')}"></script>
                        <script>
                            // register loaded language
                            hljs.registerLanguage('json', module.exports);
                            delete module;
                        </script>

                        ${documentFileLinks.join('\n')}

                        <link rel="stylesheet" href="${path.join(browserPath, './node_modules/highlight.js/styles/vs2015.css')}"></link>

                        <script>
                            var data = ${JSON.stringify(data)};
                            renderData(data);
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