import session from "express-session";
import sessionFileStore from "session-file-store";
import { v4 as uuid } from "uuid";
import Log from "./logger";

const dayMs = 1000 * 60 * 60 * 24;
const FileStore = sessionFileStore(session);

const sessionMw = session({
  // replace w/ set-once kube secret
  secret: "535ebab0-a31e-4e38-a3c8-dc4e844b3ab5",
  store: new FileStore({
    logFn: Log.debug,
    // replace w/ set-once kube secret
    secret: "1430e007-31a0-44ef-bf22-3f906e16da92",
    ttl: dayMs,
  }),
  resave: false,
  saveUninitialized: true,
  genid: (req): string => {
    const id = uuid();
    // since the session id is also used for the secret name,
    // we have to transform it so it can be part of a k8s resource name
    // https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names

    // uuid v4 is safe to use without modification.
    return id;
  },
  cookie: {
    httpOnly: true,
    maxAge: dayMs,
    // name: ""
    // sameSite: "lax",  // strict
    sameSite: "strict",
    // secure: "auto",
    secure: "auto",
  },
});

export default sessionMw;
