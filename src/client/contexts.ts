import { createContext } from "react";
import { ConnectorUserInfo } from "../common/types/user-types";
import { AlertInfo } from "./components/alerts";

export const OpenShiftUserContext = createContext<{
  user: ConnectorUserInfo,
  reload:(() => Promise<void>),
}>({} as any);

// export const GitHubUserContext = React.createContext<{
//   githubUser: ConnectorGitHubUserInfo,
// }>({} as any);

export const InConsoleContext = createContext<boolean>(false);

export const PushAlertContext = createContext<(alert: AlertInfo) => void>(
  // eslint-disable-next-line no-console
  (_alert) => console.warn(`No alert context registered`));
