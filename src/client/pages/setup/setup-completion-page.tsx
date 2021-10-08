import {
  Card,
  CardBody,
  Title,
} from "@patternfly/react-core";
import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { ExpandSidebarContext } from "../base-page";
import ClientPages from "../client-pages";

export default function SetupFinishedPage(): JSX.Element {

  const expandSidebarContext = useContext(ExpandSidebarContext);
  useEffect(() => {
    expandSidebarContext.expand();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Card>
        <CardBody>
          <Title headingLevel="h3" className="pb-2">{"Setup Complete"}</Title>
          <ul className="b">
            <li>
              <Link to={ClientPages.AddWorkflowsIndex.path}>Add Workflows</Link>
            </li>
            <li>
              <Link to={ClientPages.ImageRegistries.path}>Add an Image Registry</Link>
            </li>
            {/* <li>
              <Link to={ClientPages.NotImplemented.path}>Connect your OpenShift Image Registry</Link>
            </li>
            <li>
              <Link to={ClientPages.NotImplemented.path}>Create Self-Hosted Runners</Link>
            </li>*/}
          </ul>
          <br/>
          <ul className="b">
            <li>
              <Link to={ClientPages.App.path}>Return to the View GitHub App page</Link>
            </li>
            <li>
              <Link to={ClientPages.ConnectRepos.path}>Return to the Connect Repositories page</Link>
            </li>
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
