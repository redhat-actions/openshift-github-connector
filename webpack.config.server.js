// @ts-check

const path = require("path");
const nodeExternals = require("webpack-node-externals");

const entry = { server: "./src/server/index.ts" };

module.exports = () => {

  // const bundleNodeModules = process.env.WEBPACK_NODE_MODULES === "true";
  const bundleNodeModules = true;
  console.log(`Bundling node modules ? ${bundleNodeModules}`);

  const mode = process.env.NODE_ENV ?? "development";
  console.log(`Mode: ${mode}`);

  return {
    mode,
    target: "node",
    devtool: "inline-source-map",
    entry: entry,
    output: {
      path: path.resolve(__dirname, "build"),
      filename: "[name].js",
      // https://github.com/mui-org/material-ui/issues/18880#issuecomment-628597666
      libraryTarget: "commonjs2",
    },
    resolve: {
      extensions: [ ".ts", ".tsx", ".js" ],
      // https://github.com/gr2m/universal-github-app-jwt/issues/38
      mainFields: [ "main", "module" ],
    },
    externals: bundleNodeModules ? [
      // dependencies that webpack cannot resolve must go here
      // and exist in the node_modules folder
      // "log4js",
      // "express",
      // "@kubernetes/client-node"
    ] : [ nodeExternals() ],
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                  // use the tsconfig in the server directory
                configFile: "src/server/tsconfig.json",
              },
            },
          ],
        },
      ],
    },
  };
};
