import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brand, Page, PageHeader, PageHeaderTools,
  PageSection, PageSidebar, Title,
} from "@patternfly/react-core";
import { UserAltIcon } from "@patternfly/react-icons";

import classNames from "classnames";
import { getTitle } from "../components/title";
import ClientPages, { ClientPageOptions } from "./client-pages";
import {
  OpenShiftUserContext, InConsoleContext, PushAlertContext,
} from "../contexts";
import AlertDisplayer, { AlertInfo } from "../components/alerts";
import NotificationErrorBoundary from "../components/err-notification-boundary";

export function BasePage(props: {
  // title, options, children,
  title: string, options: ClientPageOptions, children: React.ReactNode,
}): JSX.Element {
  const [ isNavOpen, setIsNavOpen ] = useState(false);

  const [ alerts, setAlerts ] = useState<AlertInfo[]>([]);

  const inConsole = useContext(InConsoleContext);
  const { user } = useContext(OpenShiftUserContext);

  if (inConsole) {
    return (
      <>
        <PushAlertContext.Provider value={(newAlert: AlertInfo) => setAlerts([ ...alerts, newAlert ])}>
          <NotificationErrorBoundary severity="danger">
            {props.children}
          </NotificationErrorBoundary>
          <AlertDisplayer alerts={alerts} setAlerts={(newAlerts) => setAlerts(newAlerts)} />
        </PushAlertContext.Provider>
      </>
    );
  }

  return (
    <>
      {getTitle(props.title)}

      <Page
        mainContainerId="page-container"
        header={
          <PageHeader
            logo={
              <div className="center-y">
                <Brand alt="OpenShift logo" src="/img/openshift.svg" style={{ height: "2.5rem" }}/>
              </div>
            }
            logoProps={{
              href: "/",
            }}
            headerTools={
              <PageHeaderTools>
                <Link to={ClientPages.User.path} className="hover-box p-2 text-white center-y" >
                  <div className="me-3">
                    {user.name}
                  </div>
                  <UserAltIcon style={{ fontSize: "2rem" }}/>
                </Link>
              </PageHeaderTools>
            }
            showNavToggle
            isNavOpen={isNavOpen}
            onNavToggle={() => setIsNavOpen(!isNavOpen)}
          />
        }
        sidebar={
          <PageSidebar
            nav={
              <>
                <Title headingLevel="h3">Navigation</Title>
              </>
            }

            isNavOpen={isNavOpen}
          />
        }>
        <PushAlertContext.Provider value={(newAlert: AlertInfo) => setAlerts([ ...alerts, newAlert ])}>
          <PageSection id="page-content" className={classNames({ "full-width": props.options.fullWidth })}>
            <NotificationErrorBoundary severity="danger">
              {props.children}
            </NotificationErrorBoundary>
          </PageSection>
          <AlertDisplayer alerts={alerts} setAlerts={(newAlerts) => setAlerts(newAlerts)} />
        </PushAlertContext.Provider>
      </Page>
    </>
  );
}
