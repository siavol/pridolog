import * as React from "react";
import * as ReactDOM from 'react-dom'
import * as _ from 'lodash'
import * as hljs from 'highlight.js'

require('../node_modules/highlight.js/styles/vs2015.css');
require('./styles/gid-document.scss');

import { ILogItem } from './gid-document'

interface ILogItemsGroup { 
    uri: string; 
    logItems: ILogItem[]; 
}

export class GroupedLogItems extends React.Component<
{
    logItems: ILogItem[];
    workspacePath: string;
    startTime: number;
}> {

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

class LogItemRow extends React.Component<
    {
        logItem: ILogItem,
        startTime: number
    },
    {
        expanded: boolean
    }> { 
    state = {
        expanded: false
    };

    onExpandClick = () => {
        this.setState({
            expanded: !this.state.expanded            
        });
    }
    
    public render() {
        const logTime = Date.parse(this.props.logItem.logItem.time);
        const timeShift = logTime.valueOf() - this.props.startTime;

        return <tr>
            <td>
                <LinkToLogLine logItem={this.props.logItem} />
            </td>
            <td>+{timeShift} ms</td>
            <td>
                <ExpandButton expanded={this.state.expanded} onClick={this.onExpandClick} />
            </td>
            <td>
                <LogLineText logItem={this.props.logItem} expanded={this.state.expanded} />
            </td>
        </tr>
    };
}

const ExpandButton = (props: {expanded: boolean, onClick?: () => any}) => {
    return <button onClick={props.onClick}>{props.expanded ? '-' : '+'}</button>;
}

const LinkToLogLine = (props: {logItem: ILogItem}) => {
    const openParameters = {
        uri: props.logItem.uri,
        line: props.logItem.line
    };
    const goToSourceHref = encodeURI(`command:pridolog.open?${JSON.stringify(openParameters)}`);
    return <a href={goToSourceHref}>
        <pre>{props.logItem.line}:</pre>
    </a>;
}

class LogLineText extends React.Component<
{
    logItem: ILogItem;
    expanded: boolean;
}> {
    public render() {
        const logLine = this.props.expanded 
            ? JSON.stringify(this.props.logItem.logItem, undefined, 2)
            : JSON.stringify(this.props.logItem.logItem);
        return <pre className="log-item json">{logLine}</pre>;
    }

    public componentDidMount() {
        var current = ReactDOM.findDOMNode(this);
        hljs.highlightBlock(current);
    }

    public componentDidUpdate() {
        var current = ReactDOM.findDOMNode(this);
        hljs.highlightBlock(current);
    }
}