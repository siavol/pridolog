import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver'
import { getTextLines } from './textLog'

const PRIDOLOG = 'pridolog';

export function findLogProblems(documentText: string): Diagnostic[] {

    let diagnostics: Diagnostic[] = [];
	let lines = getTextLines(documentText);
	for (var i = 0; i < lines.length; i++) {
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
						message: `Error in microservice`,
						source: PRIDOLOG
					});
				} else if (logEntry.level >= 40) {
					diagnostics.push({
						severity: DiagnosticSeverity.Warning,
						range: {
							start: { line: i, character: 0 },
							end: { line: i, character: line.length-1 }
						},
						message: `Warning in microservice`,
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