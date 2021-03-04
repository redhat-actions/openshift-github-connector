#!/usr/bin/env node

const sh = require("shelljs");

const inDirs = [ "public", "views" ].map((dir) => `${dir}/`);
const outDir = "dist";

inDirs.forEach((dir) => {
    console.log(`${dir} -> ${outDir}/${dir}`);
    const result = sh.cp("-R", dir, outDir);

    if (result.stdout) {
        console.log(result.stdout);
    }
    if (result.stderr) {
        console.log(result.stderr);
    }

    if (result.code !== 0) {
        throw new Error(`Process failed with exit code ${result.code}`);
    }
});
