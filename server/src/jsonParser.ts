import * as _ from 'lodash'
import * as getJsonAst from 'json-to-ast'

interface IAstCoordinate {
    line: number;
    column: number; 
    offset: number;
}

interface IAstLocation {
    start: IAstCoordinate;
    end: IAstCoordinate;
}

type AstItem = IAstObject | IAstProperty | IAstIdentifier | IAstArray | IAstLiteral;

interface IAstObject {
    readonly type: 'Object';
    readonly children: IAstProperty[];
    readonly loc?: IAstLocation;
}

interface IAstProperty {
    readonly type: 'Property';
    readonly key: IAstIdentifier;
    readonly value: IAstObject | IAstArray | IAstLiteral;
    readonly loc?: IAstLocation;
}

interface IAstIdentifier {
    readonly type: 'Identifier';
    readonly value: string,
    readonly raw: string;
    readonly loc?: IAstLocation;
}

interface IAstArray {
    readonly type: 'Array';
    readonly children: (IAstObject | IAstArray | IAstLiteral)[],
    readonly loc?: IAstLocation;
}

interface IAstLiteral {
    readonly type: 'Literal',
    readonly value: string | number | boolean | null,
    readonly raw: string,
    readonly loc?: IAstLocation;
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

    const root = <IAstObject>getJsonAst(json);
    const itemPath = getAstItemPathByPos(root, position);

    if (itemPath.length === 1 && itemPath[0] === root) {
        // no property on position
        return null;
    }

    const fieldItem = _.findLast(itemPath, isProperty);
    const field = fieldItem.key.value;
    const path = buildPathString(itemPath);
    const value = getItemValue(fieldItem.value);

    return {field, path, value};
}

function getAstItemPathByPos(item: IAstObject, position: number): AstItem[] {
    return populatePathToItem(item, position, []);
}

function populatePathToItem(item: AstItem, position: number, path: AstItem[]): AstItem[] {
    path.push(item);
    if (isObject(item)) {
        const nextItem = _.find(item.children, c => isItemOnPosition(c, position));
        if (nextItem) {
            return populatePathToItem(nextItem, position, path);
        }
    } else if (isArray(item)) {
        const arrItem = _.find(item.children, c => isItemOnPosition(c, position));
        if (arrItem) {
            return populatePathToItem(arrItem, position, path);
        }
    } else if (isProperty(item) && isItemOnPosition(item.value, position)) {        
        return populatePathToItem(item.value, position, path);
    }
    return path;
}

function buildPathString(path: AstItem[]): string {
    let result = '';    
    for(let i=0; i<path.length; i++) {
        const item = path[i];
        if (isProperty(item)) {
            result += (result ? '.' : '') + item.key.value;
        } else if (isArray(item) && i+1 < path.length) {
            const index = _.indexOf(item.children, path[i+1]);
            result += `[${index}]`;
        }
    }
    return result;
}

function isItemOnPosition(item: AstItem, position: number): boolean {
    return item.loc.start.column <= position && item.loc.end.column >= position
}

function getItemValue(item: IAstObject | IAstArray | IAstLiteral): any {
    if (isLiteral(item)) {
        return item.value;
    } else if (isArray(item)){
        return _.map(item.children, i => getItemValue(i));
    } else {
        const obj: any = {};
        item.children.forEach(p => {
            obj[p.key.value] = getItemValue(p.value);
        });
        return obj;
    }
}

function isObject(item: AstItem): item is IAstObject {
    return item.type === 'Object';
}

function isProperty(item: AstItem): item is IAstProperty {
    return item.type === 'Property';
}

function isLiteral(item: AstItem): item is IAstLiteral {
    return item.type === 'Literal';
}

function isArray(item: AstItem): item is IAstArray {
    return item.type === 'Array';
}
