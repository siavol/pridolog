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


export interface IJsonToken {
    field: string;
    path: string;
    value: any;
}

export function getToken(json: string, position: number): IJsonToken {
    if (_.isNil(json) || position < 0 || position >= json.length) {
        return null;
    }

    const tokens: IToken[] = tokenize(json);
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

    // console.log(tokens);
    // console.log(tokenIndex);

    const field = findField(tokens, tokenIndex);
    const value = getValueForField(tokens, field.index);

    return {
        field: field.token.value,
        path: field.token.value,
        value: value
    };
}

function isRange(pos: IRangePosition | ICharPosition): pos is IRangePosition {
    return _.has(pos, 'start');
}

function findField(tokens: IToken[], index: number): { index: number, token: IToken } {
    let prev = { index, token: <IToken> null };
    do {
        prev = getPrevReal(tokens, prev.index);        
    } while(prev.index > 0 
        && !(prev.token.type === TokenType.Punctuation && prev.token.raw === '{')
        && !(prev.token.type === TokenType.Punctuation && prev.token.raw === ','));
    return getNextReal(tokens, prev.index);
}

function getValueForField(tokens: IToken[], fieldIndex: number): any {
    const {index: delimiterIndex, token: delimiter} = getNextReal(tokens, fieldIndex)
    if (delimiter.type != TokenType.Punctuation || delimiter.raw !== ':') {
        throw new Error(`Not expected token in position ${delimiterIndex}`);
    }
    
    const value = getNextReal(tokens, delimiterIndex);
    return value.token.value;
}

function getNextReal(tokens: IToken[], index: number): { index: number, token: IToken} {
    if (index === tokens.length-1) {
        return {index, token: tokens[index] };
    }

    let result = index + 1;
    while (result < tokens.length && tokens[result].type === TokenType.Whitespace) {
        result++;
    }
    return { index: result, token: tokens[result] };
}

function getPrevReal(tokens: IToken[], index: number): { index: number, token: IToken } {
    if (index === 0) {
        return { index: 0, token: tokens[0] };
    }

    let result = index-1;
    while (result > 0 && tokens[result].type === TokenType.Whitespace) {
        result--;
    }
    return { index: result, token: tokens[result] };
}