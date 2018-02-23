'use strict';

import * as _ from 'lodash'
import {
	IPCMessageReader, IPCMessageWriter, createConnection, IConnection, TextDocuments,
	InitializeResult, TextDocumentPositionParams, CompletionItem, 
	CompletionItemKind,
	ReferenceParams,
	Location, Range, Position,
	TextDocumentSyncKind,
	CodeLensParams, CodeLens,
	Command
} from 'vscode-languageserver';
import { getTextLines } from './textLog'
import { DocumentsProvider } from './documentsProvider'
import { CodeNavigator } from './codeNavigator'
import { findLogProblems } from './diagnostics'

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
	// connection.console.log(`Opening workspace: ${workspaceRoot}`);
	// connection.console.log(`Text document sync is FULL: ${documents.syncKind === TextDocumentSyncKind.Full}`);

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
			referencesProvider: true,
			definitionProvider: true,
			codeLensProvider: {
				resolveProvider: true
			}
		}
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
// documents.onDidChangeContent((change) => {
	// connection.console.log(`DOCUMENTS change: ${JSON.stringify(change)}`);
	// validateTextDocument(change.document);
// });

// documents.onDidOpen(e => {
	// connection.console.log(`DOCUMENTS open: ${JSON.stringify(e)}`);
// });


// The settings interface describe the server relevant settings part
interface Settings {
	pridolog: PridologSettings;
}

interface PridologSettings {
	showLongOperations: {
		enabled: boolean;
		durationInMs: number;
	};
}

// The duration in ms for the long operation of -1 if this analysis is disabled
let longOperationDurationMs: number = -1;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	if (settings.pridolog 
		&& settings.pridolog.showLongOperations
		&& settings.pridolog.showLongOperations.enabled) {
		
		longOperationDurationMs = settings.pridolog.showLongOperations.durationInMs || 1000;
	} else {
		longOperationDurationMs = -1;
	}
});


function validateTextDocument(documentText: string, documentUri: string): void {
	const diagnostics = findLogProblems(documentText);
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
	// connection.console.log(`connection opened, ${JSON.stringify(params.textDocument)}.`);

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

function getLogItem(textPosition: TextDocumentPositionParams): any {
	const documentText = documentsProvider.getDocumentText(textPosition.textDocument.uri);
	const lines = getTextLines(documentText);
	const logString = lines[textPosition.position.line];
	return JSON.parse(logString);
}

connection.onReferences((params: ReferenceParams): Location[] => {
	const logItem = getLogItem(params);
	return codeNavigator.findAllEntriesForGid(logItem.gid);
});

connection.onDefinition((params: TextDocumentPositionParams): Location => {
	console.log(params);
	const logItem = getLogItem(params);
	return codeNavigator.getDefinition(logItem);
});

//
// Code lens
//

connection.onCodeLens((params: CodeLensParams): CodeLens[] => {
	
	const tasks = codeNavigator.getTasksFromTheLogFile(params.textDocument.uri);
	return _(tasks)
		.filter(t => t.taskBegin && t.taskEnd)
		.map(t => {
			const range = Range.create(
				Position.create(t.taskBegin.line, 0),
				Position.create(t.taskEnd.line, t.taskEnd.source.length));
			const lens = CodeLens.create(range, t);

			const beginTime = Date.parse(t.taskBegin.logItem.time);
			const endTime = Date.parse(t.taskEnd.logItem.time);
			const timeSpend = new Date(endTime - beginTime);
			const lensTitle = `Task completed in ${timeSpend.getMilliseconds()}ms`
			lens.command = Command.create(lensTitle, 'pridolog.revealLine', 
				{ lineNumber: t.taskEnd.line });
			return lens;
		})
		.value()
});

connection.onCodeLensResolve((lens: CodeLens): CodeLens => {
	return lens;
});

// Listen on the connection
connection.listen();
