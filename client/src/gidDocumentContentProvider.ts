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

/*    $(function() {
        $("button.plus").click(function(e) {
            var parent = $(e.target).parent().parent();
            var logItemPre = parent.find("pre.log-item");
            var logItem = JSON.parse(logItemPre.text());
            var logItemExpanded = JSON.stringify(logItem, undefined, 2);

            console.log('replacing');
            var newLogItemPre = $("<pre class='log-item json'>")
                .text(logItemExpanded);
            hljs.highlightBlock(newLogItemPre[0]);
            logItemPre.replaceWith(newLogItemPre);

            parent.toggleClass("expanded");
            $(e.target).text("-");
        });

        $('pre.log-item').each(function(i, block) {
            hljs.highlightBlock(block);
        });
    });*/
                        </script>
                    </head>
                    <body>
                        <div id="root"></div>

                        <!--
                        <div>
                            <table>
                            
                            </table>
                        </div>-->
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

    /*private getLogItemHtml(item: ILogItem, startTime: number): string {
        const openParameters = {
            uri: item.uri,
            line: item.line
        };
        const logTime = Date.parse(item.logItem.time);
        const timeShift = logTime - startTime;
        const goToSourceHref = encodeURI(`command:pridolog.open?${JSON.stringify(openParameters)}`);
        return ``
    }

    */
}

export function encodeGid(gid: string) {
    return vscode.Uri.parse(`${GidDocumentContentProvider.scheme}:gid?${gid}`);
}

export function decodeGid(uri: vscode.Uri): string {
    return uri.query;
}