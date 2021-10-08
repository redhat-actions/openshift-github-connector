import { Alert, AlertActionCloseButton, AlertGroup } from "@patternfly/react-core";

import { Severity } from "../../common/common-util";

export type AlertInfo = { severity: Severity, title: string, body?: string };

export default function AlertDisplayer({ alerts, setAlerts }: { alerts: AlertInfo[], setAlerts: (newAlerts: AlertInfo[]) => void }) {

  return (
    <div id="notifications">
      <AlertGroup>
        {
          alerts.map((alert, i) => (
            <Alert key={i} variant={alert.severity} title={alert.title}
              timeout={5000}
              onTimeout={() => {
                const alertsCopy = [ ...alerts ];
                alertsCopy.splice(i, 1);
                setAlerts(alertsCopy);
              }}
              actionClose={
                <AlertActionCloseButton
                  onClose={() => {
                    const alertsCopy = [ ...alerts ];
                    alertsCopy.splice(i, 1);
                    setAlerts(alertsCopy);
                  }}
                />
              }
            >
              {alert.body ? <p>{alert.body}</p> : ""}
            </Alert>
          ))
        }
      </AlertGroup>
    </div>
  );
}
