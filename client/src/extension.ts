'use strict';

import * as path from 'path';

import { workspace, ExtensionContext, commands, TextEditor, TextEditorEdit, window, Selection } from 'vscode';
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
	let disposable = new LanguageClient('pridolog', 'PrizmDoc logs Server', serverOptions, clientOptions).start();
	
	// Push the disposable to the context's subscriptions so that the 
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);


	//
	// Commands
	//
	let opDurationCommand = commands.registerTextEditorCommand('pridolog.operationDuration',
		(textEditor: TextEditor, edit: TextEditorEdit): any[] => {
			window.showInformationMessage('Some duration will be here');
			return [];
		});
	context.subscriptions.push(opDurationCommand);

	let revealLineCommand = commands.registerTextEditorCommand('pridolog.revealLine', 
		(textEditor: TextEditor, edit: TextEditorEdit, arg: { lineNumber: number }) => {
			let range = textEditor.document.lineAt(arg.lineNumber).range;
			textEditor.selection = new Selection(range.start, range.end);
			textEditor.revealRange(range);
	});
	context.subscriptions.push(revealLineCommand);
}
