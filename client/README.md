# VSCode  - pridolog

- Highlight the PrizmDoc log files
- Navigate and search

## Usage

### Commands

* `Show operation duration` - shows the duration of the operation in cursor position. It's time between current log entry and the next one with the same *gid* and *taskid*.

### Problems

Shows first 250 (VS Code hardcoded limit) errors and warnings in the log file.
![Problems](https://git.jpg.com/ishestakov/pridolog/raw/master/tutorial-gifs/problems.gif)

### CodeLens

#### Tasks
pridolog highlights all tasks for you. You can click on task CodeLens to navigate to the task's last log entry.

#### Long operations
pridolog finds all long operations. You can control it with settings
- *pridolog.showLongOperations.enabled*
- *pridolog.showLongOperations.durationInMs*
![CodeLens](https://git.jpg.com/ishestakov/pridolog/raw/master/tutorial-gifs/code-lens-tasks.png)

### Requests navigation
Use *Go to Definition* and *Peek Definition* commands to navigate thru request log entries:
![Go to Definition](https://git.jpg.com/ishestakov/pridolog/raw/master/tutorial-gifs/go_to_definition.gif)

### Find gid references
Use *Find All References* command to find all log entries for the gid:
![Find All References](https://git.jpg.com/ishestakov/pridolog/raw/master/tutorial-gifs/problems.gif)
