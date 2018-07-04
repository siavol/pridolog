function renderData(data: {gid: string, logItems: any[]}) {

    let itemsToProcess = _.orderBy(data.logItems, ['logItem.time', 'line']);

    let startTime: number = null;
    if (itemsToProcess.length) {
        startTime = Date.parse(itemsToProcess[0].logItem.time);
    }

    const doc = <div>
        <Title gid={data.gid} />
        <StartTime time={startTime} />
    </div>;
    

    document.addEventListener("DOMContentLoaded", () => {
        ReactDOM.render(doc, document.getElementById('root'));
    });
}

const Title = (props: {gid: string}) => <h1>gid report for <b>{props.gid}</b></h1>;

const StartTime = (props: { time: number }) => 
    <div>
        Started at {new Date(props.time).toUTCString()}
    </div>;