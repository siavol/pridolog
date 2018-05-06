'use strict';

import * as path from 'path';
import { GidDocumentContentProvider, encodeGid } from './gidDocumentContentProvider';

import {
	workspace, window,
	ExtensionContext, commands, TextEditor, TextEditorEdit, 
	Selection, 
	Disposable} from 'vscode';
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient';

export function activate(context: ExtensionContext) {

	// The server is implemented in node
	let serverModule = context.asAbsolutePath(path.join('server', 'src', 'server.js'));
	// The debug options for the server
	let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };
	
	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run : { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	}
	
	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for PrizmDoc log documents
		documentSelector: [{scheme: 'file', language: 'prizmdoc-log'}],
		synchronize: {
			// Synchronize the setting section 'languageServerExample' to the server
			configurationSection: 'pridolog',
			// Notify the server about file changes to '.clientrc files contain in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	}
	
	// Create the language client and start the client.
	const languageClient = new LanguageClient('pridolog', 'PrizmDoc logs Server', serverOptions, clientOptions);
	let disposable = languageClient.start();	
	// Push the disposable to the context's subscriptions so that the 
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);

	// languageClient.


	//
	// Commands
	//
	const opDurationCommand = commands.registerTextEditorCommand('pridolog.operationDuration',
		(textEditor: TextEditor) => {
			commands.executeCommand('pridolog.server.getOperationDuration', 
				textEditor.document.uri.toString(), textEditor.selection.active.line)
				.then((result: any) => {
					if (result) {
						window.showInformationMessage('Operation duration is: ' + result.durationFormatted);
					} else {
						window.showWarningMessage('Can not get operation duration');
					}					
				});			
		});
	context.subscriptions.push(opDurationCommand);

	const showGidDocumentCommand = commands.registerCommand('pridolog.showGidDocument',
		() => {
			let gidValue = null;
			if (window.activeTextEditor 
				&& window.activeTextEditor.document.languageId === 'prizmdoc-log') {
				const lineNo = window.activeTextEditor.selection.active.line;
				const line = window.activeTextEditor.document.lineAt(lineNo);
				try {
					gidValue = JSON.parse(line.text).gid;
				} catch {}
			}
			window.showInputBox({
				prompt: 'Enter the gid for which the document will be generated',
				placeHolder: 'gid',
				value: gidValue
			}).then(gid => {
				if (gid)
					commands.executeCommand('vscode.previewHtml', 
						encodeGid(gid), undefined, `gid: ${gid}`);
			});
		});
	context.subscriptions.push(showGidDocumentCommand);

	const revealLineCommand = commands.registerTextEditorCommand('pridolog.revealLine', 
		(textEditor: TextEditor, _edit: TextEditorEdit, arg: { lineNumber: number }) => {
			const range = textEditor.document.lineAt(arg.lineNumber).range;
			textEditor.selection = new Selection(range.start, range.end);
			textEditor.revealRange(range);
	});
	context.subscriptions.push(revealLineCommand);


	//
	// Document Conten Provider
	//
	const gidDocumentProvider = new GidDocumentContentProvider();
	const contentProviderRegistration = Disposable.from(
		workspace.registerTextDocumentContentProvider(GidDocumentContentProvider.scheme, gidDocumentProvider)
	);
	context.subscriptions.push(contentProviderRegistration);
}
