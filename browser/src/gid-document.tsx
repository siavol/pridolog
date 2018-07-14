import * as React from "react";
import * as ReactDOM from 'react-dom'

import { GroupedLogItems } from './grouped-log-items'

// TODO: move common interfaces to single place
export interface ILogItem {
    uri: string;
    line: number;
    logItem: any;
}

export function renderData(data: { 
    gid: string, 
    logItems: ILogItem[], 
    workspacePath: string}) {

    let startTime: number = null;
    if (data.logItems.length) {
        startTime = Date.parse(data.logItems[0].logItem.time);
    }

    const doc = <div>
        <Title gid={data.gid} />
        <StartTime time={startTime} />
        <GroupedLogItems logItems={data.logItems} 
            workspacePath={data.workspacePath}
            startTime={startTime} />
    </div>;
    

    document.addEventListener("DOMContentLoaded", () => {
        ReactDOM.render(doc, document.getElementById('root'));
    });
}

const Title = (props: {gid: string}) => <header>
    <h1>gid report for <strong>{props.gid}</strong></h1>
</header>;

const StartTime = (props: { time: number }) => 
    <div>
        Session started at <i>{new Date(props.time).toUTCString()}</i>
    </div>;
