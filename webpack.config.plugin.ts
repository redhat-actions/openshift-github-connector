import webpack from "webpack5";
import path from "path";
import { ConsoleRemotePlugin } from "@openshift-console/dynamic-plugin-sdk/lib/webpack/ConsoleRemotePlugin";

// eslint-disable-next-line import/extensions
import { getOutDir, getSrcPath } from "./webpack.config.server";

const entry = { plugin: getSrcPath("client/app.tsx") };

export default function getWebpackConfig(env: any, argv: any): webpack.Configuration {
  const mode: "development" | "production" = argv.mode === "development" ? "development" : "production";
  const isProd = mode === "production";

  const outFilename = isProd ? "[name]-bundle-[hash].min.js" : "[name].js";
  const outChunkFilename = isProd ? "[name]-chunk-[chunkhash].min.js" : "[name]-chunk.js";
  const outputPath = path.resolve(getOutDir(), "plugin");

  console.log(`Mode: ${mode}`);
  console.log(`Outputting to ${path.join(outputPath, outFilename)} ...`);

  return {
    mode,
    entry,
    devtool: "inline-source-map",
    output: {
      path: outputPath,
      filename: outFilename,
      chunkFilename: outChunkFilename,
    },
    resolve: {
      extensions: [ ".ts", ".tsx", ".js", ".json" ],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                configFile: path.join(__dirname, "./tsconfig.json"),
                compilerOptions: {
                  noEmit: false,
                },
              },
            },
          ],
        },
        {
          test: /\.s[ac]ss$/i,
          exclude: /node_modules/,
          use: [
            "style-loader",
            "css-loader",
            "sass-loader",
          ],
        },
      ],
    },
    plugins: [
      new ConsoleRemotePlugin(),
    ],
    optimization: {
      chunkIds: isProd ? "deterministic" : "named",
      minimize: isProd,
    },
  };
}
