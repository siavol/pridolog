import * as fs from 'fs'
import * as path from 'path'
let fileUrl = require('file-url')
let uriToPath = require('file-uri-to-path')

import { TextDocuments } from 'vscode-languageserver'

export class DocumentsProvider {
    constructor(private readonly workspaceRoot: string, private readonly documents: TextDocuments) {
    }

    public getDocuments(): string[] {
        const files = fs.readdirSync(this.workspaceRoot);
        return files
            .filter(file => path.extname(file) === '.log')
            .map(file => path.join(this.workspaceRoot, file))
            .map(file => fileUrl(file));
    }

    public getDocumentText(documentUri: string): string {
        const document = this.documents.get(documentUri);
        if (document) {
            return document.getText();
        }

        const documentPath = this.getPathFromUri(documentUri);
        const buffer = fs.readFileSync(documentPath);
        return buffer.toString();
    }

    private getPathFromUri(uri: string): string {
        const normUri = uri.replace('%3A', ':');
        var path = uriToPath(normUri);
        return path;
    }

    public getUriForRelativePath(filePath: string): string {
        return fileUrl(path.join(this.workspaceRoot, filePath));
    }
}