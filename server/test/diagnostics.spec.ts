import { expect } from 'chai'
import { DiagnosticSeverity } from 'vscode-languageserver'
import { findLogProblems } from '../src/diagnostics'
import { problemSession } from './testLogs'

describe('diagnostics', () => {

    describe('findLogProblems', () => {
        
        it('should find errors', () => {
            const problems = findLogProblems(problemSession.errorLog);
            expect(problems).to.have.lengthOf(1);
            
            expect(problems[0].severity).eql(DiagnosticSeverity.Error);
            expect(problems[0].source).eql('pridolog');
            expect(problems[0].range.start.line).eql(1);
            expect(problems[0].range.end.line).eql(1);
        });

        it('should find warnings', () => {
            const problems = findLogProblems(problemSession.warningLog);
            expect(problems).to.have.lengthOf(1);
            
            expect(problems[0].severity).eql(DiagnosticSeverity.Warning);
            expect(problems[0].source).eql('pridolog');
            expect(problems[0].range.start.line).eql(0);
            expect(problems[0].range.end.line).eql(0);
        });

        it('should report parsing error as Information', () => {
            const problems = findLogProblems(problemSession.parsingErrorLog);
            expect(problems).to.have.lengthOf(1);
            
            expect(problems[0].severity).eql(DiagnosticSeverity.Information);
            expect(problems[0].source).eql('pridolog');
            expect(problems[0].range.start.line).eql(1);
            expect(problems[0].range.end.line).eql(1);
        });

        it('should not report empty strings', () => {
            const problems = findLogProblems(problemSession.emptyStringLog);
            expect(problems).to.have.lengthOf(0);
        })
    });

});