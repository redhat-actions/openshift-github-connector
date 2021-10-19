import { createContext } from "react";
import { ConnectorUserInfo } from "../common/types/user-types";
import { AlertInfo } from "./components/alerts";

export const RELOAD_USER_SEARCH = "reload-user";

export const ConnectorUserContext = createContext<{
  user: ConnectorUserInfo & { hasCompletedSetup: boolean },
  reload:(() => Promise<void>),
}>({} as any);

// export const GitHubUserContext = React.createContext<{
//   githubUser: ConnectorGitHubUserInfo,
// }>({} as any);

export const InConsoleContext = createContext<boolean>(false);

export const PushAlertContext = createContext<(alert: AlertInfo) => void>(
  // eslint-disable-next-line no-console
  (_alert) => console.warn(`No alert context registered`));
