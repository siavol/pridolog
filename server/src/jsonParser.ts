import * as _ from 'lodash'
import * as tokenize from 'json-tokenize'
import { start } from 'repl';

enum TokenType {
    Whitespace = 'whitespace',
    Punctuator = 'punctuator',
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
            return t.position.column < position;
        }
    });

    return {
        field: tokens[tokenIndex].value,
        path: tokens[tokenIndex].value,
        value: tokens[tokenIndex + 3].value
    };
}

function isRange(pos: IRangePosition | ICharPosition): pos is IRangePosition {
    return _.has(pos, 'start');
}
