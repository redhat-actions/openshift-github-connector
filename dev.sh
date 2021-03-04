#!/usr/bin/env sh

echo "--- Starting development environment ---"
set -ex
nohup sh -c "npm run ts-watch &"
npm run dev

