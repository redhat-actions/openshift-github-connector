import express from "express";
import log4js from "log4js";

let _logger: log4js.Logger | undefined;

export const LOG_CATEGORY = "default";

function getLogger(): log4js.Logger {
  if (_logger) {
    return _logger;
  }

  const FILENAME_LEN = 15;
  const config = {
    appenders: {
      out: {
        type: "stdout",
        // https://log4js-node.github.io/log4js-node/layouts.html#Pattern-format
        layout: {
          type: "pattern",
          pattern: `%[%-5p %d %${FILENAME_LEN}f{1}:%3l%] | %m`,
        },
      },
    },
    categories: {
      [LOG_CATEGORY]: {
        appenders: [ "out" ],
        level: "debug",
        enableCallStack: true,
      },
    },
  };

  log4js.configure(config);
  _logger = log4js.getLogger(LOG_CATEGORY);
  _logger.level = "debug";

  _logger.info("Logger initialized");
  return _logger;
}

export function getLoggingMiddleware(): any {
  // https://github.com/log4js-node/log4js-node/blob/master/docs/connect-logger.md
  return log4js.connectLogger(getLogger(), {
    level: "auto",
    statusRules: [
      { from: 100, to: 399, level: "debug" },
      { codes: [ 404 ], level: "warn" },
    ],
    format: (req: express.Request, res: express.Response, format) => {
      let fmt = `:method :url :status`;
      if (Object.keys(req.body).length > 0) {
        fmt += ` :content-length ${JSON.stringify(req.body)}`;
      }
      return format(fmt);
    },
  });
}

const Log = getLogger();
export default Log;
