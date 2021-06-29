import express from "express";
import log4js from "log4js";
import path from "path";
import { tmpdir } from "os";

let _logger: log4js.Logger | undefined;

export const LOG_CATEGORY = "default";

function getLogger(): log4js.Logger {
  if (_logger) {
    return _logger;
  }

  const FILENAME_LEN = 18;

  // https://log4js-node.github.io/log4js-node/layouts.html#Pattern-format
  const loggerLayout = {
    type: "pattern",
    pattern: `%[%-5p %d %${FILENAME_LEN}f{1}:%3l%] | %m`,
  };

  const logFilePath = path.join(tmpdir(), "server.log");

  const config = {
    appenders: {
      out: {
        type: "stdout",
        layout: loggerLayout,
      },
      file: {
        // https://log4js-node.github.io/log4js-node/file.html
        type: "file",
        // removes colour
        layout: {
          type: loggerLayout.type,
          layout: loggerLayout.pattern.replace(/%\[/g, "").replace(/%\]/g, ""),
        },
        filename: logFilePath,
        maxLogSize: 1024 * 1024,
        keepFileExt: true,
        // flags: "w",   // write instead of append
      },
    },
    categories: {
      [LOG_CATEGORY]: {
        appenders: [ "out", "file" ],
        level: "debug",
        enableCallStack: true,
      },
    },
  };

  log4js.configure(config);
  _logger = log4js.getLogger(LOG_CATEGORY);
  _logger.level = "debug";

  _logger.info("Logger initialized");
  _logger.info(`Logging to ${logFilePath}`);
  return _logger;
}

export function getLoggingMiddleware(): any {
  // https://github.com/log4js-node/log4js-node/blob/master/docs/connect-logger.md
  return log4js.connectLogger(getLogger(), {
    level: "auto",
    statusRules: [
      { from: 100, to: 399, level: "debug" },
      { from: 400, to: 499, level: "warn" },
    ],
    format: (req: express.Request, res: express.Response, format) => {
      let fmt = `:method :url :status`;

      // const headers = req.headers;
      // fmt += `\n${JSON.stringify(req.headers)}\n`;

      if (Number(req.headers["content-length"]) > 0) {
        fmt += ` CL=${req.headers["content-length"]}`;
      }

      if (Object.keys(req.body).length > 0) {
        const dontLogKeys = [
          "token",
          "access_token",
          "password",
          "registryPassword",
          "passwordOrToken",
        ];

        const bodyCopy = { ...req.body };
        dontLogKeys.forEach((key) => {
          delete bodyCopy[key];
        });

        fmt += `\nRequest body was:\n${JSON.stringify(bodyCopy)}`;
      }

      fmt += `\ncookie: ${JSON.stringify(req.headers.cookie)}`;
      return format(fmt);
    },
  });
}

const Log = getLogger();
export default Log;
