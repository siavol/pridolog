interface ILogItemsGroup { 
    uri: string; 
    logItems: ILogItem[]; 
}

class GroupedLogItems extends React.Component {
    props: {
        logItems: ILogItem[];
        workspacePath: string;
        startTime: number;
    }

    private getLogItemGroups() {
        let result: ILogItemsGroup[] = [];
        let processed = 0;
        while (this.props.logItems.length > processed) {
            let lastUri: string = undefined;
            const itemsChain = _(this.props.logItems)
                .drop(processed)
                .takeWhile(item => {
                    const result = lastUri === undefined || lastUri === item.uri;
                    lastUri = item.uri;
                    return result;
                })
                .value();
            const shortUri = this.getFileShortPath(
                this.props.workspacePath, 
                decodeURI(itemsChain[0].uri));
            result.push({
                uri: shortUri,
                logItems: itemsChain
            });
            processed += itemsChain.length;
        }

        return result;
    }

    private getFileShortPath(workspace: string, file: string) {
        // should be sorted by lenght desc
        const possiblePrefixes = ['file:///', 'file://', ''];
        for (let i = 0; i < possiblePrefixes.length; i++) {
            const prefix = possiblePrefixes[i];
            if (file.startsWith(prefix)) {
                const trimFile = file.slice(prefix.length);
                const trimFileNorm = trimFile.replace('\\', '/');
                const workspaceNorm = workspace.replace('\\', '/');
                const short = trimFileNorm.slice(workspaceNorm.length);
                if (short.length < file.length) {
                    return short;
                }
            }
        }
        return file;
    }

    public render() {

        const rows = _.map(this.getLogItemGroups(), 
            group => {
                const fileRow = <LogFileRow group={group} startTime={this.props.startTime} />;
                const lines = group.logItems.map(logItem => 
                    <LogItemRow logItem={logItem} startTime={this.props.startTime} />);
                return [fileRow, ...lines];
            });

        return <div>
            <table>
                {_.flatten(rows)}
            </table>
        </div>;
    }
}

const LogFileRow = (props: { group: ILogItemsGroup; startTime: number }) => <tr>
    <td colSpan={4}><h2>{decodeURI(props.group.uri)}</h2></td>
</tr>;

const LogItemRow = (props: { logItem: ILogItem, startTime: number }) => {
    const openParameters = {
        uri: props.logItem.uri,
        line: props.logItem.line
    };
    const goToSourceHref = encodeURI(`command:pridolog.open?${JSON.stringify(openParameters)}`);

    const logTime = Date.parse(props.logItem.logItem.time);
    const timeShift = logTime.valueOf() - props.startTime;

    const logLine = JSON.stringify(props.logItem.logItem);

    return <tr>
        <td>
            <button>+</button>
        </td>
        <td>
            <a href={goToSourceHref}><pre>{props.logItem.line}:</pre></a>
        </td>
        <td>+{timeShift} ms</td>
        <td><pre className="log-item json">{logLine}</pre></td>
    </tr>
};