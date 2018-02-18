import { expect } from 'chai'
import { DiagnosticSeverity } from 'vscode-languageserver'
import { findLogProblems, getProblemMessage } from '../src/diagnostics'
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

    describe('getProblemMessage', () => {

        it('should correctly format CCS error', () => {
            const logLine = '{"name":"ContentConversionService","hostname":"IlyaPC","pid":17044,"taskid":6334,"gid":"dUUxxsrVYqCtAORZ37JHIQ","level":50,"type":"ContentConversionService","err":{"message":"ENOENT, readdir \'C:\Prizm\cache\ContentConversionCache\\temp\'","name":"Error","stack":"Error: ENOENT, readdir \'C:\Prizm\cache\ContentConversionCache\\temp\'","code":"ENOENT"},"msg":"Failed to read root temp directory","time":"2018-01-12T05:52:55.501Z","v":0}';
            const logEntry = JSON.parse(logLine);
            const message = getProblemMessage(logEntry);
            expect(message).eql('Failed to read root temp directory; ENOENT, readdir \'C:\Prizm\cache\ContentConversionCache\temp\'');
        });

        it('should correctly format OCS error', () => {
            const logLine = '{"gid":"z4lzMIRWdSXcNKrvBndH8A","name":"OCS","time":"2017-10-06T07:34:26.513Z","pid":5080,"level":50,"tid":5492,"taskid":11678,"data":{"error":{"number":580004005,"message":"Document comparison failure: Document comparison failure: Error HRESULT E_FAIL has been returned from a call to a COM component."}}}';
            const logEntry = JSON.parse(logLine);
            const message = getProblemMessage(logEntry);
            expect(message).eql('Document comparison failure: Document comparison failure: Error HRESULT E_FAIL has been returned from a call to a COM component.');
        });
    });
});