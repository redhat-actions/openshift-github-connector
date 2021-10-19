// import express from "express";
import { StatusCodes } from "http-status-codes";

// eslint-disable-next-line import/no-named-default
import { default as MyUser } from "server/lib/user/user";
import { UserSessionData } from "server/lib/user/server-user-types";
import UserInstallation from "./lib/github/user-app-installation";

declare module "express-session" {
  interface SessionData {
    user?: UserSessionData,
  }
}

declare global {
  namespace Express {
    // if using passport session, set this to the type you are serializing to the passport user obj
    // export type User = UserSessionData;
    export type User = UserSessionData;

    interface Request {
      /**
       * Returns the user object if it can be resolved from the session.
       *
       * If 'die' is true AND it returns undefined, it sends a 401, ending the req/res cycle, and
       * the caller MUST exit the request handler.
       */
      getUserOr401: (die?: boolean) => Promise<MyUser | undefined>,

      /**
       * Similar to getUserOr401, but tries to get the user's GitHub app installation.
       */
      getInstallationOr400: (die?: boolean) => Promise<UserInstallation | undefined>,
    }

    interface Response {
      /**
       * Extension of res.sendStatus which respects content-type,
       * and sends a ApiResponses.Result if the Content-Type is JSON.
       */
      sendStatus: (code: StatusCodes) => Express.Response<ApiResponses.Result>,

      sendError: (
        statusCode: StatusCodes,
        detail: string,
        severity: "warning" | "danger" = "danger",
        log: boolean = true,
      ) => void,

      send401: () => void,
      // send405: (allowed: HttpConstants.Methods[]) => void,
    }
  }
}
