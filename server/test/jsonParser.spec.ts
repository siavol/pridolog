import { expect } from 'chai'
import { getToken } from '../src/jsonParser'

describe('jsonParser', () => {

    describe('getToken', () => {
        it('should return null when input json in nil', () => {
            expect(getToken(null, 1)).to.be.null;
            expect(getToken(undefined, 1)).to.be.null;
        });

        it('should return null when position is out of range', () => {
            expect(getToken('{"foo": 1}', -1)).to.be.null;
            expect(getToken('{"foo": 1}', 20)).to.be.null;
        });

        it('should return first level token', () => {
            const json = '{"foo": 1, "bar": "test"}';
            expect(getToken(json, 3)).eql({
                field: 'foo',
                path: 'foo', 
                value: 1
            });
            expect(getToken(json, 8)).eql({
                field: 'foo',
                path: 'foo',
                value: 1
            });

            expect(getToken(json, 17)).eql({
                field: 'bar',
                path: 'bar',
                value: "test"
            });
        });

        it('shoud return null if no token at position', () => {
            const json = '{"foo": 1, "bar": "test"}';
            expect(getToken(json, 0)).to.be.null;
        });

        it('should return token from inner level', () => {
            const json = '{"foo":{"bar":1, "biz":"test"}}';
            expect(getToken(json, 12)).eql({
                field: 'bar',
                path: 'foo.bar',
                value: 1
            });
        })
    });
});