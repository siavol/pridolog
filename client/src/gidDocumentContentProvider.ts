import * as vscode from 'vscode';

export class GidDocumentContentProvider implements vscode.TextDocumentContentProvider {

    public static scheme = 'pridolog-gid';

    // onDidChange?: vscode.Event<vscode.Uri>;

    provideTextDocumentContent(uri: vscode.Uri/*, _token: vscode.CancellationToken*/): vscode.ProviderResult<string> {
        const gid = decodeGid(uri);

        // commands.executeCommand('pridolog.server.getLogItemsForGid', gid);


        return `<!DOCTYPE html>
            <html lang="en">
            <head></head>
            <body>
                <h1>GID REPORT for</h1> <b>${gid}</b>
            </body>`;
    }
}

export function encodeGid(gid: string) {
    return vscode.Uri.parse(`${GidDocumentContentProvider.scheme}:gid?${gid}`);
}

export function decodeGid(uri: vscode.Uri): string {
    return uri.query;
}