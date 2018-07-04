// TODO: move common interfaces to single place
interface ILogItem {
    uri: string;
    line: number;
    logItem: any;
}

function renderData(data: { 
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

const Title = (props: {gid: string}) => <h1>gid report for <i>{props.gid}</i></h1>;

const StartTime = (props: { time: number }) => 
    <div>
        Started at <i>{new Date(props.time).toUTCString()}</i>
    </div>;
