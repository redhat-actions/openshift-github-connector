import webpack from "webpack5";
import path from "path";
import nodeExternals from "webpack-node-externals";

export function getSrcPath(relPath: string): string {
  return path.join(__dirname, "src", relPath);
}

export function getOutDir(): string {
  return path.join(__dirname, "dist");
}

const entry = { server: getSrcPath("server/index.ts") };

export default function getWebpackConfig(env: any, argv: any): webpack.Configuration {

  console.log(`Webpack v${webpack.version}`);

  const mode = argv.mode === "development" ? "development" : "production";
  console.log(`Mode: ${mode}`);

  const bundleNodeModules = mode === "production";
  console.log(`Bundling node modules ? ${bundleNodeModules}`);

  const outputDir = path.resolve(getOutDir(), "server");
  const outFileName = "[name].js";
  console.log(`Outputting to ${path.join(outputDir, outFileName)} ...`);

  return {
    mode,
    entry,
    target: "node",
    devtool: "inline-source-map",
    output: {
      path: outputDir,
      filename: outFileName,
      chunkFilename: "[name]-chunk.js",
      // https://github.com/mui-org/material-ui/issues/18880#issuecomment-628597666
      libraryTarget: "commonjs2",
    },
    resolve: {
      extensions: [ ".ts", ".tsx", ".js", ".json" ],
      // https://github.com/gr2m/universal-github-app-jwt/issues/38
      mainFields: [ "main", "module" ],

      alias: {
        // match server/tsconfig.json "paths"
        server: getSrcPath("server"),
        common: getSrcPath("common"),
      },
    },
    // externalsPresets: { node: true },
    externals: bundleNodeModules ? [
      // dependencies that webpack cannot resolve must go here
      // and exist in the node_modules folder
      // "log4js",
      // "express",
      // "@kubernetes/client-node"
    ] : [ nodeExternals() as any ],   // types don't match webpack5 interface
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                // use the tsconfig in the server directory
                configFile: getSrcPath("server/tsconfig.json"),
              },
            },
          ],
        },
      ],
    },
  };
}
