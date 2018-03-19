import * as fs from 'fs'
import * as path from 'path'
import * as _ from 'lodash'
let fileUrl = require('file-url')
let uriToPath = require('file-uri-to-path')

import { TextDocuments } from 'vscode-languageserver'

export class DocumentsProvider {
    constructor(private readonly workspaceRoot: string, private readonly documents: TextDocuments) {
    }

    public getDocuments(): string[] {
        const rootFiles = fs.readdirSync(this.workspaceRoot);

        const filesInFolders = _(rootFiles)
            .filter(filePath => {
                const fullPath = path.join(this.workspaceRoot, filePath);
                return fs.statSync(fullPath).isDirectory();
            })
            .flatMap(dir => {
                const dirPath = path.join(this.workspaceRoot, dir);
                return fs.readdirSync(dirPath).map(file => path.join(dir, file))
            })
            .value();

        return _.union(rootFiles, filesInFolders)
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