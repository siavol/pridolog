# VSCode  - pridolog

- Highlight the PrizmDoc log files
- Navigate and search

## Usage

### Commands

* `Show operation duration` - shows the duration of the operation in cursor position. It's time between current log entry and the next one with the same *gid* and *taskid*.

### Problems

Shows first 250 (VS Code hardcoded limit) errors and warnings in the log file.
![Problems](./tutorial-gifs/problems.gif)

### CodeLens

#### Tasks
pridolog highlights all tasks for you. You can click on task CodeLens to navigate to the task's last log entry.

#### Long operations
pridolog finds all long operations. You can control it with settings
- *pridolog.showLongOperations.enabled*
- *pridolog.showLongOperations.durationInMs*
![CodeLens](https://raw.githubusercontent.com/siavol/pridolog/a001d24b7b7ffdd4f4710e20b276670406124af9/client/tutorial-gifs/code-lens-tasks.png)

### Requests navigation
Use *Go to Definition* and *Peek Definition* commands to navigate thru request log entries:
![Go to Definition](https://media.githubusercontent.com/media/siavol/pridolog/main/client/tutorial-gifs/go_to_definition.gif)

### Find gid references
Use *Find All References* command to find all log entries for the gid:
![Find All References](https://media.githubusercontent.com/media/siavol/pridolog/main/client/tutorial-gifs/find_all_references.gif)

### Gid document
Use *Show log entries for the gid* command to show all log entries for the gid in a separate document. It shows all log items for some specific gid in chronological order, 
allows navigation and viewing log items in tree view.
![Show log entries for the gid](https://media.githubusercontent.com/media/siavol/pridolog/main/client/tutorial-gifs/gid_document.gif)