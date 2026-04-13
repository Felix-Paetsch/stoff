#!/bin/bash

SESSION="stoff_nvim"

# check if the session already exists
tmux has-session -t "$SESSION" 2>/dev/null

if [ $? != 0 ]; then
  tmux new-session -s "$SESSION" -d

  tmux send-keys -t "$SESSION":1 "nvim" C-m

  tmux new-window -t "$SESSION":2 -n "server"
  tmux send-keys -t "$SESSION":2 "just watch-server" C-m

  tmux new-window -t "$SESSION":3 -n "test"
  tmux send-keys -t "$SESSION":3 "just test::watch" C-m

  tmux select-window -t "$SESSION":1
fi

# attach to the session
tmux attach -t "$SESSION"
