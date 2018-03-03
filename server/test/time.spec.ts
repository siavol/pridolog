import { expect } from 'chai'
import { durationFormat } from '../src/time'

describe.only('time', () => {

    [
        { durationInMs: 2, expectedResult: '2 ms' },
        { durationInMs: 2003, expectedResult: '2 seconds 3 ms' },
        { durationInMs: 2000, expectedResult: '2 seconds' },
        { durationInMs: 1 * 60 * 1000, expectedResult: '1 minute' },
        { durationInMs: 3 * 60 * 1000, expectedResult: '3 minutes' },
        { durationInMs: 3 * 60 * 1000 + 2 * 1000 + 123, expectedResult: '3 minutes 2 seconds' },
        { durationInMs: 3 * 60 * 1000 + 1 * 1000 + 123, expectedResult: '3 minutes 1 second' },
        { durationInMs: 4 * 60 * 60 * 1000 + 2 * 1000 + 123, expectedResult: '4 hours' },
        { durationInMs: 1 * 60 * 60 * 1000 + 1 * 60 * 1000 + 123 + 10 * 1000, expectedResult: '1 hour 1 minute' }
    ].forEach(testCase => {
        it(`should format duration in ms ${testCase.durationInMs} as '${testCase.expectedResult}'`, () => {
            expect(durationFormat(testCase.durationInMs)).eql(testCase.expectedResult);
        });

        const timeSpan = new Date(testCase.durationInMs);
        it(`should format Date ${timeSpan} as '${testCase.expectedResult}'`, () => {
            expect(durationFormat(timeSpan)).eql(testCase.expectedResult);
        });
    });
});