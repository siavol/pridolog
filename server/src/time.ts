import * as _ from 'lodash'

const msInSecond = 1000;
const msInMinute = 60 * 1000;

const timeParts = [
    { ms: 60 * 60 * 1000, name: ['hour', 'hours'] },
    { ms: 60 * 1000, name: ['minute', 'minutes'] },
    { ms: 1000, name: ['second', 'seconds'] },
    { ms: 1, name: ['ms', 'ms'] }
];

export function durationFormat(timeSpan: Date | number): string {

    let durationMs: number;
    if (_.isDate(timeSpan)) {
        durationMs = timeSpan.valueOf();
    } else {
        durationMs = timeSpan;
    }

    const resultPart = [] as {timePartIndex: number; str: string}[];
    const isPartsEnough = (i: number) => {
        if (resultPart.length === 0) {
            return false;
        }
        return i > resultPart[0].timePartIndex + 1;
    }

    for (let i=0; i < timeParts.length && !isPartsEnough(i); i++) {
        const part = timeParts[i];
        let count: number;
        if (i > 0) {
            const prevPart = timeParts[i-1];
            count = Math.floor((durationMs % prevPart.ms) / part.ms);
        } else {
            count = Math.floor(durationMs / part.ms);
        }

        if (count > 0) {
            const str = (count === 1) 
                ? `${count} ${part.name[0]}`
                : `${count} ${part.name[1]}`;
            resultPart.push({
                timePartIndex: i,
                str
            });
        }       
    }

    return resultPart.map(p => p.str).join(' ');
}