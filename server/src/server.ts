'use strict';

import {
	IPCMessageReader, IPCMessageWriter, createConnection, IConnection, TextDocuments,
	Diagnostic, DiagnosticSeverity, InitializeResult, TextDocumentPositionParams, CompletionItem, 
	CompletionItemKind,
	ReferenceParams,
	Location,
	TextDocumentSyncKind
} from 'vscode-languageserver';
import { getTextLines } from './textLog'
import { DocumentsProvider } from './documentsProvider'
import { CodeNavigator } from './codeNavigator'

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities. 
let workspaceRoot: string;
let documentsProvider: DocumentsProvider;
let codeNavigator: CodeNavigator;
connection.onInitialize((params): InitializeResult => {
	workspaceRoot = params.rootPath;
	connection.console.log(`Opening workspace: ${workspaceRoot}`);
	connection.console.log(`Text document sync is FULL: ${documents.syncKind === TextDocumentSyncKind.Full}`);

	documentsProvider = new DocumentsProvider(workspaceRoot, documents);
	codeNavigator = new CodeNavigator(documentsProvider);

	return {
		capabilities: {
			// Tell the client that the server works in FULL text document sync mode
			textDocumentSync: documents.syncKind,
			// Tell the client that the server support code complete
			completionProvider: {
				resolveProvider: true
			},
			referencesProvider: true
		}
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	connection.console.log(`DOCUMENTS change: ${JSON.stringify(change)}`);
	// validateTextDocument(change.document);
});

documents.onDidOpen(e => {
	connection.console.log(`DOCUMENTS open: ${JSON.stringify(e)}`);
});

// The settings interface describe the server relevant settings part
interface Settings {
	lspSample: ExampleSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface ExampleSettings {
	maxNumberOfProblems: number;
}

// hold the maxNumberOfProblems setting
let maxNumberOfProblems: number;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	maxNumberOfProblems = settings.lspSample.maxNumberOfProblems || 100;
	// Revalidate any open text documents
	// documents.all().forEach(validateTextDocument);
});

function validateTextDocument(documentText: string, documentUri: string): void {
	let diagnostics: Diagnostic[] = [];
	let lines = getTextLines(documentText);
	let problems = 0;
	for (var i = 0; i < lines.length && problems < maxNumberOfProblems; i++) {
		let line = lines[i];
		try {
			const logEntry = JSON.parse(line);
			if (logEntry.level >= 50) {
				problems++;
				diagnostics.push({
					severity: DiagnosticSeverity.Error,
					range: {
						start: { line: i, character: 0 },
						end: { line: i, character: line.length-1 }
					},
					message: `Error in microservice`,
					source: 'ex'
				});
			}
		} catch (parceErr) {
			problems++;
			diagnostics.push({
				severity: DiagnosticSeverity.Warning,
				range: {
					start: { line: i, character: 0 },
					end: { line: i, character: line.length }
				},
				message: `Can not parse: ${parceErr}`,
				source: 'ex'
			});
		}
		// let index = line.indexOf('typescript');
		// if (index >= 0) {
		// 	problems++;
		// 	diagnostics.push({
		// 		severity: DiagnosticSeverity.Warning,
		// 		range: {
		// 			start: { line: i, character: index },
		// 			end: { line: i, character: index + 10 }
		// 		},
		// 		message: `${line.substr(index, 10)} should be spelled TypeScript`,
		// 		source: 'ex'
		// 	});
		// }
	}
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: documentUri, diagnostics });
}

connection.onDidChangeWatchedFiles((_change) => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});


// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in 
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.
	return [
		{
			label: 'TypeScript',
			kind: CompletionItemKind.Text,
			data: 1
		},
		{
			label: 'JavaScript',
			kind: CompletionItemKind.Text,
			data: 2
		}
	]
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	if (item.data === 1) {
		item.detail = 'TypeScript details',
			item.documentation = 'TypeScript documentation'
	} else if (item.data === 2) {
		item.detail = 'JavaScript details',
			item.documentation = 'JavaScript documentation'
	}
	return item;
});

connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`connection opened, ${JSON.stringify(params.textDocument)}.`);

	// const textDocument = documents.get(params.textDocument.uri);
	validateTextDocument(params.textDocument.text, params.textDocument.uri);
});
/*
connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	// connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);

	// const textDocument = documents.get(params.textDocument.uri);
	// validateTextDocument(textDocument);
});
*/

connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});

connection.onReferences((params: ReferenceParams): Location[] => {
	const documentText = documentsProvider.getDocumentText(params.textDocument.uri);
	const lines = getTextLines(documentText);
	const logString = lines[params.position.line];
	const logItem = JSON.parse(logString);
	return codeNavigator.findAllEntriesForGid(logItem.gid);
});

// Listen on the connection
connection.listen();
