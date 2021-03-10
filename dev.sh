#!/usr/bin/env sh

TERMINAL=urxvt
TERMINAL_WD_ARG="-cd"
TERMINAL_EXEC_ARG="-e"

echo "--- Starting development environment ---"
set -eEux

$TERMINAL $TERMINAL_WD_ARG $PWD $TERMINAL_EXEC_ARG bash -c "npm run ts-watch" &
disown -a
npm run nodemon
