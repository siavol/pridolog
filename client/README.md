# VSCode  - pridolog

- Highlight the PrizmDoc log files
- Navigate and search

## Usage

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

### Requests navigation
Use *Go to Definition* and *Peek Definition* commands to navigate thru request log entries:
![Go to Definition](https://git.jpg.com/ishestakov/pridolog/raw/master/tutorial-gifs/go_to_definition.gif)

### Find gid references
Use *Find All References* command to find all log entries for the gid:
![Find All References](https://git.jpg.com/ishestakov/pridolog/raw/master/tutorial-gifs/problems.gif)
