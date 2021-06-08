import webpack from "webpack5";
import wds from "webpack-dev-server";
import path from "path";
import { ConsoleRemotePlugin } from "@tetchel/dynamic-plugin-sdk/lib/webpack/ConsoleRemotePlugin";
// eslint-disable-next-line import/extensions
import { getOutDir } from "./webpack.config.server";
// eslint-disable-next-line import/extensions
import Package from "./package.json";

// const entry = { plugin: path.relative(__dirname, getSrcPath("client/app.tsx")) };

const CONSOLE_API_BASE_PATH = `/api/plugins/${Package.consolePlugin.name}/`;

function devServerConfig(outputDir: string): wds.Configuration {
  const wdsConfig: wds.Configuration = {
    contentBase: outputDir,

    compress: true,
    hot: true,
    host: "localhost",
    // https: true,
    port: 8081,
    publicPath: "/",
    writeToDisk: true,

    proxy: {
      [CONSOLE_API_BASE_PATH]: {
        target: "http://localhost:8080",
        secure: false,
        pathRewrite: { [`^${CONSOLE_API_BASE_PATH}`]: "" },
      },
    },
  };

  // console.log(`Dev server configured at ${devServer.host}:${devServer.port}${devServer.publicPath}`);
  console.log(
    `Connect plugin to cluster by running from 'console' directory: `
    + `./bin/bridge -plugins ${Package.consolePlugin.name}=http${wdsConfig.https === true ? "s" : ""}://${wdsConfig.host}:${wdsConfig.port}`
  );

  return wdsConfig;
}

export default function getWebpackConfig(
  env: any, argv: any
): webpack.Configuration & { devServer: wds.Configuration } {

  const mode: "development" | "production" = argv.mode === "development" ? "development" : "production";
  const isProd = mode === "production";

  const outFilename = isProd ? "[name]-bundle-[fullhash].min.js" : "[name].js";
  // const outFilename = isProd ? "[name]-bundle-[fullhash].min.js" : "[name].js";
  const outChunkFilename = isProd ? "[name]-chunk-[chunkhash].min.js" : "[name]-chunk.js";
  const outputDir = path.resolve(getOutDir(), "plugin");

  console.log(`Webpack v${webpack.version}`);
  console.log(`Mode: ${mode}`);
  console.log(`Outputting to ${path.join(outputDir, outFilename)} ...`);

  return {
    mode,
    // entry,
    devtool: isProd ? "source-map" : "eval-source-map",
    devServer: isProd ? {} : devServerConfig(outputDir),
    output: {
      path: outputDir,
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
        {
          test: /\.css$/i,
          use: [
            "style-loader",
            "css-loader",
          ],
        },
        // https://github.com/patternfly/patternfly-react-seed/blob/master/webpack.common.js
        {
          test: /\.(jpg|jpeg|png|gif)$/i,
          use: [
            {
              loader: "url-loader",
              options: {
                limit: 5000,
                outputPath: "images",
                name: "[name].[ext]",
              },
            },
          ],
        },
        {
          test: /\.(svg|ttf|eot|woff|woff2)$/,
          use: {
            loader: "file-loader",
            options: {
              limit: 5000,
              outputPath: "fonts",
              name: "[name].[ext]",
            },
          },
        },
        {
          // This prevents loading the patternfly base.css in the console, which causes the console styling to screw up.
          test: /patternfly\/react-core\/dist\/styles\/base.css/,
          use: {
            loader: "null-loader",
          },
        },
      ],
    },
    plugins: [
      new ConsoleRemotePlugin() as unknown as webpack.WebpackPluginInstance,
      new webpack.EnvironmentPlugin({
        IN_OPENSHIFT_CONSOLE: true,
        // this is used by api-endpoints.ts
        API_BASE_PATH: CONSOLE_API_BASE_PATH,
      }),
    ],
    optimization: {
      chunkIds: isProd ? "deterministic" : "named",
      minimize: isProd,
    },
  };
}
