# Express-TS Template

Docker and Kube-ready Express application in TypeScript with speedy development.

## Developing

First, `npm i` to install dependencies.

Then, to set up fast reloading:

`./dev.sh`

Alternatively, run:

`npm run ts-watch` and `npm run dev`

in **separate** terminals.

The project's TypeScript will be compiled incrementally, and static files will be copied into the dist/ folder on change. The app is restarted after any static file change or TypeScript compile.

## Building and Running in Docker
See `npm run docker-run`.
