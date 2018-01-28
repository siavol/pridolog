declare module 'json-tokenize' {
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

    const tokenize: (json: string) => IToken[];

    export = tokenize;
}