import {
  Brand, Page, PageHeader, PageHeaderTools,
  PageSection,
} from "@patternfly/react-core";
import { UserAltIcon } from "@patternfly/react-icons";
import classNames from "classnames";
import React, {
  createContext, useContext, useMemo, useState,
} from "react";
import { Link } from "react-router-dom";
import AlertDisplayer, { AlertInfo } from "../components/alerts";
import NotificationErrorBoundary from "../components/err-notification-boundary";
import { getTitle } from "../components/title";
import { ConnectorUserContext, PushAlertContext } from "../contexts";
import ClientPages, { ClientPageOptions } from "./client-pages";
import { getSidebarPages, MySidebar } from "./sidebar";

/**
 * Provides an API to pages to force-expand the sidebar to draw a user's attention to it.
 */
export const ExpandSidebarContext = createContext({ expand: () => { /* no-op */ } });

export function BasePage(props: {
  // title, options, children,
  title: string, options: ClientPageOptions, children: React.ReactNode,
}): JSX.Element {

  const { user } = useContext(ConnectorUserContext);

  const sidebarPages = useMemo(() => getSidebarPages(user), [ user ]);

  const canUseNav = sidebarPages.top.concat(sidebarPages.bottom).length > 0;

  const [ isNavOpen, setIsNavOpen ] = useState(false);

  const [ alerts, setAlerts ] = useState<AlertInfo[]>([]);

  /*
  const inConsole = useContext(InConsoleContext);

  if (inConsole) {
    return (
      <>
        <PushAlertContext.Provider value={(newAlert: AlertInfo) => setAlerts(alerts.concat(newAlert))}>
          <NotificationErrorBoundary severity="danger">
            {props.children}
          </NotificationErrorBoundary>
          <AlertDisplayer alerts={alerts} setAlerts={(newAlerts) => setAlerts(newAlerts)} />
        </PushAlertContext.Provider>
      </>
    );
  }
  */

  return (
    <>
      {getTitle(props.title)}

      <ExpandSidebarContext.Provider value={{ expand: () => setIsNavOpen(true) } }>

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
              showNavToggle={canUseNav}
              isNavOpen={isNavOpen}
              onNavToggle={() => setIsNavOpen(!isNavOpen)}
            />
          }
          sidebar={<MySidebar isNavOpen={isNavOpen} sidebarPages={sidebarPages} /> }
        >
          <PushAlertContext.Provider value={(newAlert: AlertInfo) => setAlerts(alerts.concat(newAlert))}>
            <PageSection id="page-content" className={classNames({ "full-width": props.options.fullWidth })}>
              <NotificationErrorBoundary severity="danger">
                {props.children}
              </NotificationErrorBoundary>
            </PageSection>
            <AlertDisplayer alerts={alerts} setAlerts={(newAlerts) => setAlerts(newAlerts)} />
          </PushAlertContext.Provider>
        </Page>
      </ExpandSidebarContext.Provider>
    </>
  );
}
