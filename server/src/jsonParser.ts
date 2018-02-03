import * as _ from 'lodash'
import * as tokenize from 'json-tokenize'

enum TokenType {
    Whitespace = 'whitespace',
    Punctuation = 'punctuation',
    String = 'string',
    Number = 'number',
    Literal = 'literal'
}

interface ICharPosition {
    lineno: number;
    column: number;
}

interface IRangePosition {
    start: ICharPosition;
    end: ICharPosition;
}

interface IToken {
    type: TokenType;
    position: ICharPosition | IRangePosition;
    raw: string,
    value: any
}

interface ITokenIndex {
    index: number;
    token: IToken;
}

interface IValueIndex {    
    lastIndex: number;
    value: any;
}

export interface IJsonToken {
    field: string;
    path: string;
    value: any;
}

export function getToken(json: string, position: number): IJsonToken {
    if (_.isNil(json) || position < 0 || position >= json.length) {
        return null;
    }

    const tokens = _.filter(<IToken[]>tokenize(json), 
        t => t.type !== TokenType.Whitespace);
    const tokenIndex = _.findLastIndex(tokens, t => {
        if (isRange(t.position)) {
            return t.position.start.lineno === 1 && t.position.end.lineno === 1
                && t.position.start.column <= position && t.position.end.column >= position;                
        } else {
            return t.position.column <= position;
        }
    });

    if (tokenIndex < 0) {
        return null;
    }

    const field = findField(tokens, tokenIndex);
    const value = getValueForField(tokens, field.index);
    const fieldPath = getFieldPath(tokens, field.index);

    return {
        field: field.token.value,
        path: fieldPath,
        value: value.value
    };
}

function isRange(pos: IRangePosition | ICharPosition): pos is IRangePosition {
    return _.has(pos, 'start');
}

function findField(tokens: IToken[], index: number): ITokenIndex {
    const initial = {index, token: tokens[index]};

    if (initial.token.type === TokenType.String) {
        // it can be field or value part
        const punct = getNext(tokens, index, t => t.type === TokenType.Punctuation);
        if (punct.token.type === TokenType.Punctuation
            && punct.token.raw === ':') {
            // initial token is field
            return initial;
        }
    }

    if (initial.token.type === TokenType.Punctuation && initial.token.raw === ':') {
        return getPrev(tokens, initial.index, t => t.type === TokenType.String);
    }

    const prev = getPrev(tokens, initial.index,
        t => t.type === TokenType.Punctuation && t.raw === ':');
    return getPrev(tokens, prev.index);
}

function getValueForField(tokens: IToken[], fieldIndex: number): any {
    const {index: delimiterIndex, token: delimiter} = getNext(tokens, fieldIndex)
    if (delimiter.type != TokenType.Punctuation || delimiter.raw !== ':') {
        throw new Error(`Not expected token in position ${delimiterIndex}`);
    }
    
    const value = getNext(tokens, delimiterIndex);
    return getTokenValue(tokens, value.index);
}

function getTokenValue(tokens: IToken[], index: number): IValueIndex {
    const initial = tokens[index];
    if (initial.type === TokenType.String || initial.type === TokenType.Number) {
        return { lastIndex: index, value: initial.value };
    }

    if (initial.type === TokenType.Punctuation && initial.raw === '[') {
        const firstItem = getNext(tokens, index);
        const result = populateArray(tokens, firstItem.index, []);
        return result;
    }

    throw new Error('Not implemented');
}

function populateArray(tokens: IToken[], itemIdex: number, array: any[]): IValueIndex {
    const itemValue = getTokenValue(tokens, itemIdex);
    array.push(itemValue.value);

    const next = getNext(tokens, itemValue.lastIndex);
    if (next.token.type !== TokenType.Punctuation) {
        throw new Error(`Not expected token at ${next.index}`);
    }

    if (next.token.raw === ']') {
        // array end
        return {
            lastIndex: next.index,
            value: array
        };
    } else if (next.token.raw === ',') {
        // there are more items
        const nextItem = getNext(tokens, next.index);
        return populateArray(tokens, nextItem.index, array);
    } else {
        throw new Error(`Not expected token at ${next.index}`);
    }
}

function getFieldPath(tokens: IToken[], fieldIndex: number): string {
    const pathTokens: ITokenIndex[] = [];
    let current = { index: fieldIndex, token: tokens[fieldIndex] };
    do {
        pathTokens.push(current);
        current = getFieldParent(tokens, current.index);
    } while(current);

    return _(pathTokens)
        .reverse()
        .map(p => p.token.value)
        .join('.');
}

function getFieldParent(tokens: IToken[], fieldIndex: number): ITokenIndex {
    const objectStart = getPrev(tokens, fieldIndex,
        t => t.type === TokenType.Punctuation && t.raw === '{');
    const arrayStart = getPrev(tokens, fieldIndex,
        t => t.type === TokenType.Punctuation && t.raw === '[');
    // if (arrayStart.index < objectStart.index) {
    //     let itemIndexInArray = 0;
    //     let tokenIndex = fieldIndex;
    //     getPrev(tokens, tokenIndex,
    //         t => t.type === TokenType.Punctuation && t.)
    // }

    const delimiter = getPrev(tokens, objectStart.index,
        t => t.type === TokenType.Punctuation && t.raw === ':');
    if (delimiter.index > 0) {
        return getPrev(tokens, delimiter.index)
    } else {
        return null;
    }
}

function getNext(tokens: IToken[], index: number,
    predicate?: (t: IToken, i: number) => boolean): ITokenIndex {

    if (index === tokens.length-1) {
        return {index, token: tokens[index] };
    }

    let result = index + 1;
    if (predicate) {
        while (result < tokens.length && !predicate(tokens[result], result)) {
            result++;
        }
    }
    return { index: result, token: tokens[result] };
}

function getPrev(tokens: IToken[], index: number,
    predicate?: (t: IToken, i: number) => boolean): ITokenIndex {

    if (index === 0) {
        return { index: 0, token: tokens[0] };
    }

    let result = index-1;
    if (predicate) {
        while (result > 0 && !predicate(tokens[result], result)) {
            result--;
        }
    }
    return { index: result, token: tokens[result] };
}