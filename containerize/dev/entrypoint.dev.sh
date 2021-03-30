#!/bin/sh

onterm() {
  kill $pid
  echo "Killed"
}

trap onterm SIGTERM
trap onterm SIGINT

set -ex

yarn run dev &
pid=$!
wait $pid
