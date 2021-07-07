import { createContext } from "react";
import { Severity } from "../../common/common-util";

export type AlertInfo = { severity: Severity, title: string, body?: string };

type PushAlertFunc = (alert: AlertInfo) => void;

export const ConnectorAlertContext = createContext<PushAlertFunc>(
  // eslint-disable-next-line no-console
  (_alert) => console.warn(`No alert context registered`)
);
