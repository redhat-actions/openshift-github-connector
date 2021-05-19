#!/bin/sh

onterm() {
  echo "Shutting down..."
  kill $client_pid
  echo "Killed client"
  kill $plugin_pid
  echo "Killed plugin"
  kill $server_pid
  echo "Killed server"
}

trap onterm SIGTERM
trap onterm SIGINT

set -ex

serve --listen $FRONTEND_PORT --single ./client &
client_pid=$!
sleep 1

serve --listen $FRONTEND_PORT --single ./plugin &
plugin_pid=$!
sleep 1

node --inspect server/server.js &
server_pid=$!

wait $server_pid
