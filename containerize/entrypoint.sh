#!/bin/sh

onterm() {
  echo "Shutting down..."
  kill $client_pid
  echo "Killed client"
  kill $server_pid
  echo "Killed server"
}

trap onterm SIGTERM
trap onterm SIGINT

set -ex

serve --listen $FRONTEND_PORT --single ./client &
client_pid=$!
sleep 1

node server/server.js &
server_pid=$!

wait $server_pid
