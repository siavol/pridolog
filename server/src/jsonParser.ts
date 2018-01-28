import * as _ from 'lodash'
import * as tokenize from 'json-tokenize'

export interface IJsonToken {
    field: string;
    path: string;
    value: any;
}

export function getToken(json: string, position: number): IJsonToken {
    if (_.isNil(json) || position < 0 || position >= json.length) {
        return null;
    }

    const tokens = tokenize(json);
    _.takeWhile

    return null;
}