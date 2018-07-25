import * as React from "react";
import * as ReactDOM from 'react-dom'
import * as _ from 'lodash'
import * as hljs from 'highlight.js'

require('../node_modules/highlight.js/styles/vs2015.css');
require('./styles/grouped-log-items.scss');

import { ILogItem } from '../../common/logItemInterfaces'

interface ILogItemsGroup { 
    uri: string; 
    logItems: IExpandableLogItem[]; 
}

interface IExpandableLogItem extends ILogItem {
    expanded: boolean;
}

export class GroupedLogItems extends React.Component<
{
    logItems: ILogItem[];
    workspacePath: string;
    startTime: number;
},
{
    groups: ILogItemsGroup[];
}> {
    state = {
        groups: this.getLogItemGroups()
    };

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
                .map(item => _.extend({ expanded: false }, item))
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

    expandLogItem = (group: ILogItemsGroup, logItem: IExpandableLogItem) => {
        this.setState(prevState => {
            const groupIndex = prevState.groups.indexOf(group);

            const logGroupClone = _.clone(group);
            const logItemIndex = logGroupClone.logItems.indexOf(logItem);
            const logItemClone = _.clone(logItem);

            logItemClone.expanded = !logItem.expanded;
            logGroupClone.logItems[logItemIndex] = logItemClone;

            const groupsClone = _.clone(prevState.groups);
            groupsClone[groupIndex] = logGroupClone;

            return {
                groups: groupsClone
            };
        });
    }

    public render() {

        const rows = _.map(this.state.groups, 
            group => {
                const fileRow = <LogFileRow group={group} startTime={this.props.startTime} 
                    key={`${group.uri}:${group.logItems[0].line}`} />;
                const lines = group.logItems.map(logItem => 
                    <LogItemRow logItem={logItem} startTime={this.props.startTime}
                        onExpanded={() => this.expandLogItem(group, logItem)}
                        key={`item_${logItem.uri}:${logItem.line}`}/>);
                return [fileRow, ...lines];
            });

        return <div className="log-items-container">
            {_.flatten(rows)}
        </div>;
    }
}

export class LogFileRow extends React.Component<{ 
    group: ILogItemsGroup; 
    startTime: number;
}> {

    public render() {
        const decodedUri = decodeURI(this.props.group.uri);
        return <div className="log-title">
            <h2>{decodedUri} <button>++</button></h2>            
        </div>;
    }
}

class LogItemRow extends React.Component<
    {
        logItem: IExpandableLogItem;
        startTime: number;
        onExpanded: () => any;
    }> { 

    onExpandClick = () => {
        this.props.onExpanded();
    }
    
    public render() {
        const key = `${this.props.logItem.uri}:${this.props.logItem.line}`;
        return [
            <LinkToLogLine logItem={this.props.logItem} key={"link_"+key} />,
            <LogTime logItem={this.props.logItem} startTime={this.props.startTime} key={"time_" + key} />,
            <ExpandButton expanded={this.props.logItem.expanded} onClick={this.onExpandClick} key={"plus_" + key} />,
            <LogLineText logItem={this.props.logItem} expanded={this.props.logItem.expanded} key={"json_" + key} />
        ];
    };
}

const ExpandButton = (props: {expanded: boolean, onClick?: () => any}) => {
    return <button onClick={props.onClick} className="log-item-plus">{props.expanded ? '-' : '+'}</button>;
}

const LinkToLogLine = (props: { logItem: ILogItem}) => {
    const openParameters = {
        uri: props.logItem.uri,
        line: props.logItem.line
    };
    const goToSourceHref = encodeURI(`command:pridolog.open?${JSON.stringify(openParameters)}`);
    return <a href={goToSourceHref} className="log-item-number">
            <pre>{props.logItem.line}:</pre>
        </a>;
}

const LogTime = (props: { logItem: ILogItem, startTime: number}) => {
    const logTime = Date.parse(props.logItem.logItem.time);
    const timeShift = logTime.valueOf() - props.startTime;
    return <div className="log-item-time">+{timeShift} ms</div>;
};

class LogLineText extends React.Component<
{
    logItem: ILogItem;
    expanded: boolean;
}> {
    public render() {
        const logLine = this.props.expanded 
            ? JSON.stringify(this.props.logItem.logItem, undefined, 2)
            : JSON.stringify(this.props.logItem.logItem);
        return <pre className="log-item-json json">{logLine}</pre>;
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