import { expect } from 'chai'

import { DocumentsCache } from '../src/documentsCache'

describe('DocumentsCache', () => {
    let cache: DocumentsCache;

    beforeEach(() => {
        cache = new DocumentsCache();
    });

    describe('set', () => {
        describe('when container does not exist for a key', () => {
            it('creates the new container', () => {
                const data = {
                    lines: [{ line: 0, logItem: { foo: 1 }, source: 'log source' }]
                };
                cache.set('test_uri', data);

                expect(cache.get('test_uri')).eql({
                    uri: 'test_uri',
                    lines: data.lines
                });
            });
        });

        describe('when container exists for a key', () => {
            const originalLines = [{ line: 0, logItem: { foo: 1 }, source: 'log source' }];

            beforeEach(() => {
                const data = {
                    lines: originalLines
                };
                cache.set('test_uri', data);
            });

            it('updates container with specified properties', () => {
                const newLines = [
                    { line: 1, logItem: { bar: 1 }, source: 'first line' },
                    { line: 2, logItem: { bar: 2 }, source: 'second line' }
                ];
                cache.set('test_uri', {
                    lines: newLines
                })

                expect(cache.get('test_uri')).eql({
                    uri: 'test_uri',
                    lines: newLines
                });
            });

            it('does not change not specified properties', () => {
                const tasks = [{
                    taskBegin: { line: 2, logItem: { taskBegin: true }, source: 'task begin' },
                    taskEnd: { line: 5, logItem: { taskEnd: true }, source: 'task end' }
                }];
                cache.set('test_uri', { tasks });

                expect(cache.get('test_uri')).eql({
                    uri: 'test_uri',
                    lines: originalLines,
                    tasks
                });
            });
        });
    });

    describe('get', () => {
        const originalLines = [{ line: 0, logItem: { foo: 1 }, source: 'log source' }];

        beforeEach(() => {
            const data = {
                lines: originalLines
            };
            cache.set('test_uri', data);
        });

        it('returns undefined for not existing uri', () => {
            expect(cache.get('no_such_uri')).to.be.undefined;
        });

        it('returns container shallow clone', () => {
            const container1 = cache.get('test_uri');
            const container2 = cache.get('test_uri');
            
            container1.longOperations = [];
            expect(container1).not.eql(container2);
            
            container1.lines[0].line = 10;
            expect(container1.lines).eql(container2.lines);
        });
    });
});