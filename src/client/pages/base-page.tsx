import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import {
  Brand,
  Page, PageHeader, PageHeaderTools, PageSection, PageSidebar, Title,
} from "@patternfly/react-core";

import { UserAltIcon } from "@patternfly/react-icons";
import { getTitle } from "../components/title";
import ClientPages from "./client-pages";
import { OpenShiftUserContext, InConsoleContext } from "../contexts";

export function BasePage({ title, content: Content }: { title: string, content: React.ComponentType<any> }): JSX.Element {
  const [ isNavOpen, setIsNavOpen ] = useState(false);

  const inConsole = useContext(InConsoleContext);
  const { user } = useContext(OpenShiftUserContext);

  if (inConsole) {
    return (
      <Content />
    );
  }

  return (
    <>
      {getTitle(title)}

      <Page header={
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
      } sidebar={
        <PageSidebar
          nav={
            <>
              <Title headingLevel="h3">Navigation</Title>
            </>
          }

          isNavOpen={isNavOpen}
        />
      }>
        <PageSection>
          <Content />
        </PageSection>
      </Page>
    </>
  );
}
