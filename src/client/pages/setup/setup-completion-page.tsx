import {
  Card,
  CardTitle,
  CardBody,
  Title,
} from "@patternfly/react-core";
import { Link } from "react-router-dom";
import ClientPages from "../client-pages";

export default function SetupFinishedPage(): JSX.Element {
  return (
    <>
      <Card>
        <CardTitle>
          Setup Complete
        </CardTitle>
        <CardBody>
          <Title headingLevel="h3" className="pb-2">{"What's Next"}</Title>
          <ul className="b">
            <li>
              <Link to={ClientPages.ImageRegistries.path}>Add an Image Registry</Link>
            </li>
            <li>
              <Link to={ClientPages.AddWorkflows.path}>Add the OpenShift starter workflow</Link>
            </li>
            <li>
              <Link to={ClientPages.NotImplemented.path}>Connect your OpenShift Image Registry</Link>
            </li>
            <li>
              <Link to={ClientPages.NotImplemented.path}>Create Self-Hosted Runners</Link>
            </li>
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
