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
        value: value
    };
}

function isRange(pos: IRangePosition | ICharPosition): pos is IRangePosition {
    return _.has(pos, 'start');
}

function findField(tokens: IToken[], index: number): ITokenIndex {
    const prev = getPrev(tokens, index,
        t => t.type === TokenType.Punctuation && (t.raw === '{' || t.raw === ','));
    return getNext(tokens, prev.index);
}

function getValueForField(tokens: IToken[], fieldIndex: number): any {
    const {index: delimiterIndex, token: delimiter} = getNext(tokens, fieldIndex)
    if (delimiter.type != TokenType.Punctuation || delimiter.raw !== ':') {
        throw new Error(`Not expected token in position ${delimiterIndex}`);
    }
    
    const value = getNext(tokens, delimiterIndex);
    return value.token.value;
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