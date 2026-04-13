#!/bin/bash

SESSION="stoff_run"

# check if the session already exists
tmux has-session -t "$SESSION" 2>/dev/null

if [ $? != 0 ]; then
  tmux new-session -s "$SESSION" -d


  tmux send-keys -t "$SESSION":1 "just standalone watch"

  tmux new-window -t "$SESSION":2 -n "typecheck"
  tmux send-keys -t "$SESSION":2 "just typecheck" C-m

  tmux new-window -t "$SESSION":3
  tmux send-keys -t "$SESSION":3 "just build"

  tmux select-window -t "$SESSION":1
fi

# attach to the session
tmux attach -t "$SESSION"
