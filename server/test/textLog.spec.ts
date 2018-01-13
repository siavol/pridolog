import { expect } from 'chai'
import * as sinon from 'sinon'
import { getTextLines, parseTextLog, IParsingError } from '../src/textLog'

describe('textLog', () => {

    describe('getTextLines', () => {
        it('should return empty array for null', () => {
            const lines = getTextLines(null);
            expect(lines).to.be.an('array').that.is.empty;            
        });

        it('should return empty array for empty string', () => {
            const lines = getTextLines('');
            expect(lines).to.be.an('array').that.is.empty;            
        });

        it('should return array with lines for text separated with \\r\\n', () => {
            const lines = getTextLines('one\r\ntwo');
            expect(lines).to.eql(['one', 'two']);            
        });

        it('should return array with lines for text separated with \\n', () => {
            const lines = getTextLines('one\ntwo');
            expect(lines).to.eql(['one', 'two']);            
        });
    });

    describe('parseTextLog', () => {
        it('should return parsed items', () => {
            const logItems = parseTextLog('{"foo":1}\n{"bar":"two"}');
            expect(logItems).to.eql([ 
                { line: 0, logItem: { foo: 1 }, source: '{"foo":1}'}, 
                { line: 1, logItem: { bar: "two" }, source: '{"bar":"two"}' }
            ]);
        });

        it('should not call error handler if there are no errors', () => {
            const errorhandler = sinon.stub();
            const logItems = parseTextLog('{"foo":1}\n{"bar":"two"}', errorhandler);
            expect(errorhandler.notCalled).to.be.true;
            expect(logItems).to.have.lengthOf(2);
        });

        it('should call error handler if there is an error', () => {
            const errorhandler = sinon.stub();
            const logItems = parseTextLog('{"foo":1}\n{asd:}\n{"bar":"two"}', errorhandler);
            errorhandler.calledWith(sinon.match((arg: IParsingError) => {
                expect(arg.line).to.eql(1);
                expect(arg.error).to.be.not.null;
            }));
            expect(logItems).to.have.lengthOf(2);
        });
    });
});