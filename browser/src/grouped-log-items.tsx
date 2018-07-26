import * as React from "react";
import * as ReactDOM from 'react-dom'
import * as _ from 'lodash'
import * as hljs from 'highlight.js'

require('../node_modules/highlight.js/styles/vs2015.css');
require('./styles/grouped-log-items.scss');

import { ILogItem } from '../../common/logItemInterfaces'

interface ILogItemsGroup { 
    uri: string; 
    logItems: ILogItem[]; 
}

export class LogItemGroupList extends React.Component<
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

        const groups = this.getLogItemGroups();
        const rows = _.map(groups, 
            group => {
                return <LogItemGroup uri={group.uri} logItems={group.logItems} startTime={this.props.startTime} 
                    key={`group_${group.uri}:${group.logItems[0].line}`}/>;
            });

        return <div className="log-items-container">
            {_.flatten(rows)}
        </div>;
    }
}

class LogItemGroup extends React.Component<{
    uri: string;
    logItems: ILogItem[];
    startTime: number;
},{
    allExpanded: boolean | null;
    items: { logItem: ILogItem; expanded: boolean; }[]
}>{
    state = {
        allExpanded: false,
        items: this.props.logItems.map(logItem => ({ expanded: false, logItem }))
    };

    expandLogItem = (item: { logItem: ILogItem; expanded: boolean; }) => {
        this.setState(prevState => {
            const itemIndex = prevState.items.indexOf(item);
            if (itemIndex < 0) {
                throw new Error("Changed logItem not found in the state items");
            }

            const itemsClone = _.clone(prevState.items);
            const updatedItemClone = _.clone(prevState.items[itemIndex]);

            updatedItemClone.expanded = !updatedItemClone.expanded;
            itemsClone[itemIndex] = updatedItemClone;

            let allExpanded = null;
            if (itemsClone[0].expanded) {
                if (_(itemsClone).drop(1).findIndex(i => !i.expanded) < 0) {
                    allExpanded = true;
                }
            } else {
                if (_(itemsClone).drop(1).findIndex(i => i.expanded) < 0) {
                    allExpanded = false;
                }
            }

            return {
                items: itemsClone,
                allExpanded
            };
        });
    }

    expandGroup = () => {
        this.setState(prevState => {
            const allExpanded = !prevState.allExpanded;
            const items = prevState.items.map(item => {
                if (item.expanded === allExpanded) {
                    return item;
                } else {
                    return {
                        logItem: item.logItem,
                        expanded: allExpanded
                    };
                }
            });

            return { items, allExpanded };
        });
    }

    public render() {
        const fileRow = <LogFileRow uri={this.props.uri}
            expanded={this.state.allExpanded}
            onExpanded={() => this.expandGroup()}
            key={`${this.props.uri}:${this.props.logItems[0].line}`} />;
        const lines = this.state.items.map(item =>
            <LogItemRow logItem={item.logItem} startTime={this.props.startTime}
                expanded={item.expanded}
                onExpanded={() => this.expandLogItem(item)}
                key={`item_${item.logItem.uri}:${item.logItem.line}`} />);
        return [fileRow, ...lines];
    }
}

class LogFileRow extends React.Component<{ 
    uri: string;
    expanded: boolean | null;
    onExpanded: () => any;
}> {

    public render() {        
        const decodedUri = decodeURI(this.props.uri);
        let buttonText: string;
        if (this.props.expanded === true) {
            buttonText = '--';
        } else if (this.props.expanded === false) {
            buttonText = '++';
        } else {
            buttonText = '..';
        }
        return <div className="log-title">
            <h2>{decodedUri} <button onClick={this.props.onExpanded}>{buttonText}</button></h2>
        </div>;
    }
}

class LogItemRow extends React.Component<
    {
        logItem: ILogItem;
        startTime: number;
        expanded: boolean;
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
            <ExpandButton expanded={this.props.expanded} onClick={this.onExpandClick} key={"plus_" + key} />,
            <LogLineText logItem={this.props.logItem} expanded={this.props.expanded} key={"json_" + key} />
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