import { createContext } from "react";
import { Severity } from "../common/common-util";
import { OpenShiftUserInfo } from "../common/types/user-types";

export const OpenShiftUserContext = createContext<{
  user: OpenShiftUserInfo,
  reload:(() => Promise<void>),
    }>({} as any);

// export const GitHubUserContext = React.createContext<{
//   githubUser: ConnectorGitHubUserInfo,
// }>({} as any);

export const InConsoleContext = createContext<boolean>(false);

// The Alerts are set up in base-page.tsx
export type AlertInfo = { severity: Severity, title: string, body?: string };

export const PushAlertContext = createContext<(alert: AlertInfo) => void>(
  // eslint-disable-next-line no-console
  (_alert) => console.warn(`No alert context registered`));
