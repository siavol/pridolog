import * as _ from 'lodash'
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { getTextLines } from './textLog'

const PRIDOLOG = 'pridolog';
const MAX_PROBLEMS_COUNT = 255; // VS Code does not show more than 250 problems. We will send a little bit more so that it will show that problems list was trunkated

export function findLogProblems(documentText: string): Diagnostic[] {

    let diagnostics: Diagnostic[] = [];
	let lines = getTextLines(documentText);
	for (var i = 0; i < lines.length && diagnostics.length < MAX_PROBLEMS_COUNT; i++) {
		let line = lines[i];
		if (line && line.trim()) {
			try {
				const logEntry = JSON.parse(line);
				if (logEntry.level >= 50) {
					diagnostics.push({
						severity: DiagnosticSeverity.Error,
						range: {
							start: { line: i, character: 0 },
							end: { line: i, character: line.length-1 }
						},
						message: getProblemMessage(logEntry),
						source: PRIDOLOG
					});
				} else if (logEntry.level >= 40) {
					diagnostics.push({
						severity: DiagnosticSeverity.Warning,
						range: {
							start: { line: i, character: 0 },
							end: { line: i, character: line.length-1 }
						},
						message: getProblemMessage(logEntry),
						source: PRIDOLOG
					})
				}
			} catch (parceErr) {
				diagnostics.push({
					severity: DiagnosticSeverity.Information,
					range: {
						start: { line: i, character: 0 },
						end: { line: i, character: line.length }
					},
					message: `Can not parse: ${parceErr}`,
					source: PRIDOLOG
				});
			}
		}
    }
    return diagnostics;
}

export function getProblemMessage(logEntry: any): string {
	let message = '';
	function addMessagePart(part: string) {
		if (part) {
			if (message) {
				message += '; ';
			}
			message += part;
		}
	}

	addMessagePart(logEntry.msg);
	addMessagePart(_.get(logEntry, 'err.message'));
	addMessagePart(_.get(logEntry, 'data.error.message'));

	if (!message) {
		message = JSON.stringify(logEntry);
	}

	return message;
}